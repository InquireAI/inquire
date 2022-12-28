import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import type { BadRequestRes, SuccessRes, DatabaseError, UnauthorizedRes, NotFoundRes } from "../../../api-responses";
import { prisma, SubscriptionStatus, User, Subscription } from "../../../../db/client";
import { zodIssuesToBadRequestIssues } from "../../../utils";
import { env } from "../../../../../env/server.mjs";
import { Configuration, OpenAIApi } from 'openai'
import axios, { AxiosRequestConfig } from 'axios';
import logger from 'consola'

// configure the openai api
const configuration = new Configuration({
  apiKey: env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// define the body schema
const BodySchema = z.object({
  connectionType: z.enum(["WEB", "TELEGRAM"]),
  connectionUserId: z.string(),
  userId: z.string(),
  queryType: z.string(),
  query: z.string(),
});

type Res = SuccessRes<String> | BadRequestRes | DatabaseError | UnauthorizedRes | NotFoundRes;

export async function createInquiry(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {
  // validate the body
  const bodyParse = await BodySchema.spa(req.body);

  // return if the body is invalid
  if (!bodyParse.success) {
    logger.error(`Invalid request body: ${JSON.stringify(bodyParse.error.issues)}`)
    return res.status(400).json({
      code: "BAD_REQUEST",
      message: "Invalid request body",
      issues: zodIssuesToBadRequestIssues(bodyParse.error.issues),
    });
  }

  // parse the body
  const { data: bodyData } = bodyParse;

  logger.info(`Received POST /api/v1/inquiries request with body: ${JSON.stringify(bodyData)}`)

  // we check the connections table beacuse a user 
  // might not have signed up via the website but we want 
  // to still log the # of inquiries
  // in this case the `userId` is unique to the user _and_ 
  // the `connection`. It is not unique to the user alone.
  let connection = await prisma.connection.findFirst({
    where: {
      connectionType: bodyData.connectionType,
      userId: bodyData.userId
    }
  })

  // check if user already has a connection
  // if not create a connection
  // else continue
  if (!connection) {
    try {
      const createConnection = await prisma.connection.create({
        data: {
          connectionType: bodyData.connectionType,
          connectionUserId: bodyData.connectionUserId,
          userId: bodyData.userId,
        }
      })

      // get the connection data
      connection = await prisma.connection.findFirst({
        where: {
          connectionType: bodyData.connectionType,
          userId: bodyData.userId
        }
      })

      logger.info(`Created new connection for user ${bodyData.userId}`)
    } catch (error) {
      logger.error("Error in creating new connection: " + error)
    }
  } else {
    logger.info(`User ${bodyData.userId} already has a connection`)
  }

  // check if connection is null
  if (!connection) {
    return res.status(400).json({
      code: "BAD_REQUEST",
      message: `Connection does not exist`,
    })
  }

  // In order to validate a inquiry we
  // - check the users limits
  // - if user is over limit check if they are paying
  // - if they are paying allow the inquiry
  // - if they are not paying return a message saying they have exceeded the limit

  // @TODO: not sure why connections is not a type on User when its defined in the schema
  // Query users, loop over connections for one with the right connectionType and userId
  const users: User[] = await prisma.user.findMany({ 
    include: {
      connections: true
    }
  })

  let connectedUser: User | null = null
  users.forEach((user) => {
    user.connections.forEach((connection) => {
      // checking if connectionType and userId match
      if (connection.connectionType === bodyData.connectionType && connection.userId === bodyData.userId) {
        connectedUser = user        
      }
    })
  })

  // check the users limits
  const inquiries = await prisma.inquiry.findMany({
    where: {
      connectionType: bodyData.connectionType,
      connectionUserId: connection.connectionUserId
    }
  })

  // check if the user is paying via stripe 
  // note, in order for this to a connection _must_ be created and connected into a user account
  // so that we can check if the user is paying
  let stripeCustomer: Subscription | null = null
  if (connectedUser) {
    stripeCustomer = await prisma.subscription.findUnique({
      where: {
        id: connectedUser.id
      }
    })
  }

  // if there is a user check if they hit limit and are paying
  if (stripeCustomer) {
    const subscriptionStatus: SubscriptionStatus = stripeCustomer.status
    if (inquiries.length > env.USER_INQUIRY_LIMIT && (subscriptionStatus !== SubscriptionStatus.ACTIVE && subscriptionStatus !== SubscriptionStatus.TRIALING)) {  
      logger.error(`User ${bodyData.userId} has exceeded the inquiry limit ${inquiries.length}}`)
      return res.status(400).json({
        code: "UNAUTHORIZED",
        message: `User Limit Error`,
      })
    }
  } else {
    // if there is no user check if they hit limit
    if (inquiries.length > env.USER_INQUIRY_LIMIT) {
      logger.error(`User ${bodyData.userId} has exceeded the inquiry limit ${inquiries.length}`)
      return res.status(400).json({
        code: "UNAUTHORIZED",
        message: `User Limit Error`,
      })
    }
  }

  // Handle the inquiry

  // create new inquriy entry in table
  const inquiry = await prisma.inquiry.create({
    data: {
      connectionType: bodyData.connectionType,
      connectionUserId: bodyData.connectionUserId,
      queryType: bodyData.queryType,
      query: bodyData.query,
    },
  });

  // check if queryType is chat or use the dust app to query the persona
  if (bodyData.queryType === "chat") {
    logger.info(`Query type is chat, sending to OpenAI`)

    // hit raw dv3 no need for dust 
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: bodyData.query,
      temperature: 0.9,
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0.6
    })

    // check if response is undefined 
    if (!response.data.choices[0]) {
      logger.error(`OpenAI response is undefined`)
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: `Bad Request`,
      })
    }

    let formattedResponse = response.data.choices[0].text

    logger.success(`Prompt ${bodyData.query}\n Received response from OpenAI: ${formattedResponse}`)
    // return the response
    res.status(200).json({
      data: formattedResponse,
    });
  } else {
    logger.info(`Query type is ${bodyData.queryType}, sending to Dust`)

    // hit dust app
    // define headers with auth
    const headers = {
      'Authorization': 'Bearer ' + env.DUST_API_KEY,
      'Content-Type': 'application/json'
    }

    // find the app id for the queryType
    // else return error
    let app;
    try {
      app = await prisma.persona.findUnique({
        where: {
          name: bodyData.queryType,
        }
      });
    } catch (error) {
      logger.error("Error in finding persona: " + error)
      return res.status(500).json({
        code: "NOT_FOUND",
        message: `Persona not found`,
      })
    }

    // check if app is null 
    if (!app) {
      logger.error(`Persona ${bodyData.queryType} not found`)
      return res.status(400).json({
        code: "DATABASE_ERROR",
        message: `Database Error`,
      })
    }

    // break out the app data
    const name = app.name
    const id = app.id
    const specificationHash = app.specificationHash
    const config = JSON.parse(app.config)

    const requestConfig: AxiosRequestConfig = {
      baseURL: 'https://dust.tt/api/v1/apps/Lucas-Kohorst/',
      headers: headers
    }

    // query the dust app
    const options = {
        "specification_hash": specificationHash,
        "config": config,
        "blocking": false, // true to wait for the run to complete, usually want as false
        "inputs": [{ "question": bodyData.query }]
    }

    // query the dust app
    let data = await axios.post(`${id}/runs`, options, requestConfig)
      .then((response) => response.data)
      .catch((error) => {
        logger.error("Error in querying Dust app: " + error)
        return res.status(500).json({
          code: "DATABASE_ERROR",
          message: `Database Error`,
        })
      });
    
    const runId = data.run.run_id

    // check if run is complete
    let run = await axios.get(`${id}/runs/${runId}`, requestConfig)
      .then((response) => response.data)

    logger.success(run)

    // checking if run is complete usually take ~10-15s
    while(run.run.status.run !== "succeeded") {
      // wait a few seconds while run is processing
      await new Promise(r => setTimeout(r, 3000));
      // query the run again
      run = await axios.get(`${id}/runs/${runId}`, requestConfig)
      .then((response) => response.data)
    }

    // handle dust api error 
    if (data.error) {
      logger.error("Dust API error: " + data.error)
      return res.status(400).json({
        code: "DATABASE_ERROR",
        message: `Database Error`,
      })
    }

    // parse the response
    let formattedResponse = run.run.results[0][0].value.completion.text

    logger.success(`Prompt ${bodyData.query}\n Received response from OpenAI: ${formattedResponse}`)
    // return the response
    return res.status(200).json({
      data: formattedResponse,
    });
  }
}