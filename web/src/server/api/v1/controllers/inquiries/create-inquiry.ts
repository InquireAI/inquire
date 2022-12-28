import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import type {
  BadRequestRes,
  SuccessRes,
  InternalError,
  UnauthorizedRes,
  NotFoundRes,
} from "../../../api-responses";
import { prisma } from "../../../../db/client";
import { zodIssuesToBadRequestIssues } from "../../../utils";
import { env } from "../../../../../env/server.mjs";
import { Configuration, OpenAIApi } from "openai";
import axios, { type AxiosRequestConfig } from "axios";
import logger from "consola";

// configure the openai api
const configuration = new Configuration({
  apiKey: env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// define the body schema
const BodySchema = z.object({
  connectionType: z.enum(["WEB", "TELEGRAM"]),
  connectionUserId: z.string(),
  queryType: z.string(),
  query: z.string(),
});

type Res =
  | SuccessRes<string>
  | BadRequestRes
  | UnauthorizedRes
  | NotFoundRes
  | InternalError;

export async function createInquiry(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {
  // validate the body
  const bodyParse = await BodySchema.spa(req.body);

  // return if the body is invalid
  if (!bodyParse.success) {
    logger.error(
      `Invalid request body: ${JSON.stringify(bodyParse.error.issues)}`
    );
    return res.status(400).json({
      code: "BAD_REQUEST",
      message: "Invalid request body",
      issues: zodIssuesToBadRequestIssues(bodyParse.error.issues),
    });
  }

  // parse the body
  const { data: bodyData } = bodyParse;

  logger.info(
    `Received POST /api/v1/inquiries request with body: ${JSON.stringify(
      bodyData
    )}`
  );

  // we check the connections table beacuse a user
  // might not have signed up via the website but we want
  // to still log the # of inquiries
  // in this case the `userId` is unique to the user _and_
  // the `connection`. It is not unique to the user alone.
  let connection = await prisma.connection.findUnique({
    where: {
      connectionType_connectionUserId: {
        connectionType: bodyData.connectionType,
        connectionUserId: bodyData.connectionUserId,
      },
    },
  });

  // check if user already has a connection
  // if not create a connection
  // else continue
  if (!connection) {
    connection = await prisma.connection.create({
      data: {
        connectionType: bodyData.connectionType,
        connectionUserId: bodyData.connectionUserId,
      },
    });
    logger.info(
      `New connection with type: ${bodyData.connectionType} and connectionUserId: ${bodyData.connectionUserId} created`
    );
  } else {
    logger.info(
      `Connection with type: ${bodyData.connectionType} and connectionUserId: ${bodyData.connectionUserId} already exists`
    );
  }

  // In order to validate a inquiry we
  // - check the users limits
  // - if user is over limit check if they are paying
  // - if they are paying allow the inquiry
  // - if they are not paying return a message saying they have exceeded the limit

  // Query users, loop over connections for one with the right connectionType and userId

  if (connection.userId) {
    const user = await prisma.user.findUnique({
      where: {
        id: connection.userId,
      },
      include: {
        customer: {
          include: {
            subscriptions: true,
          },
        },
      },
    });

    // NOTE: may be multiple products/prices/subscription in future, but currently we only have one, so just look for the first element
    const subscription = user?.customer?.subscriptions[0];

    // TODO: add more helpful error codes to report back to user what is wrong with subscription
    if (!subscription) {
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: "Subscription not found",
      });
    }

    // if subscription is not one of these statuses it's invalid
    if (
      subscription.status !== "ACTIVE" &&
      subscription.status !== "TRIALING"
    ) {
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: "Invalid subscription",
      });
    }
  } else {
    const inquiries = await prisma.inquiry.findMany({
      where: {
        connectionType: bodyData.connectionType,
        connectionUserId: connection.connectionUserId,
      },
    });

    if (inquiries.length > env.USER_INQUIRY_LIMIT) {
      logger.info(
        `Connection with type: ${bodyData.connectionType} and connectionUserId: ${bodyData.connectionUserId} has reached inquiry limit`
      );

      // TODO: implement an error code for QUOTA_REACHED
      return res.status(400).json({
        code: "UNAUTHORIZED",
        message: `User Limit Error`,
      });
    }
  }

  // check if queryType is chat or use the dust app to query the persona
  if (bodyData.queryType === "chat") {
    logger.info(`Query type is chat, sending to OpenAI`);

    // hit raw dv3 no need for dust
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: bodyData.query,
      temperature: 0.9,
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0.6,
    });

    // check if response is undefined
    if (!response.data.choices[0]) {
      logger.error(`OpenAI response is undefined`);
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: `Bad Request`,
      });
    }

    const formattedResponse = response.data.choices[0].text;

    if (!formattedResponse)
      return res.status(500).json({
        code: "INTERNAL_ERROR",
      });

    logger.success(
      `Prompt ${bodyData.query}\n Received response from OpenAI: ${formattedResponse}`
    );
    // return the response
    res.status(200).json({
      data: formattedResponse,
    });
  } else {
    logger.info(`Query type is ${bodyData.queryType}, sending to Dust`);

    // hit dust app
    // define headers with auth
    const headers = {
      Authorization: "Bearer " + env.DUST_API_KEY,
      "Content-Type": "application/json",
    };

    // find the app id for the queryType
    // else return error
    const persona = await prisma.persona.findUnique({
      where: {
        name: bodyData.queryType,
      },
    });

    if (!persona) {
      logger.error(`No persona found with name: ${bodyData.queryType}`);
      return res.status(400).json({
        code: "NOT_FOUND",
        message: `Persona not found`,
      });
    }

    // break out the app data
    const id = persona.id;
    const specificationHash = persona.specificationHash;
    const config = JSON.parse(persona.config);

    const requestConfig: AxiosRequestConfig = {
      baseURL: "https://dust.tt/api/v1/apps/Lucas-Kohorst/",
      headers: headers,
    };

    // query the dust app
    const options = {
      specification_hash: specificationHash,
      config: config,
      blocking: false, // true to wait for the run to complete, usually want as false
      inputs: [{ question: bodyData.query }],
    };

    // query the dust app

    // TODO: make some types to represent the data

    let data;
    try {
      const res = await axios.post(`${id}/runs`, options, requestConfig);
      data = res.data;
    } catch (error) {
      logger.error("Error in querying Dust app", error);
      return res.status(500).json({
        code: "INTERNAL_ERROR",
      });
    }

    if (data.error) {
      logger.error("Dust API error: " + data.error);
      return res.status(500).json({
        code: "INTERNAL_ERROR",
      });
    }

    const runId = data.run.run_id;

    let run;

    while (run.run.status.run !== "succeeded") {
      // wait a few seconds while run is processing
      // query the run again
      run = await axios
        .get(`${id}/run/${runId}`, requestConfig)
        .then((response) => response.data);

      await new Promise((r) => setTimeout(r, 3000));
    }

    // handle dust api error

    // parse the response
    const formattedResponse = run.run.results[0][0].value.completion.text;

    logger.success(
      `Prompt ${bodyData.query}\n Received response from OpenAI: ${formattedResponse}`
    );

    await prisma.inquiry.create({
      data: {
        connectionType: bodyData.connectionType,
        connectionUserId: bodyData.connectionUserId,
        queryType: bodyData.queryType,
        query: bodyData.query,
      },
    });

    // return the response
    return res.status(200).json({
      data: formattedResponse,
    });
  }
}
