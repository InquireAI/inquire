import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import type { BadRequestRes, SuccessRes } from "../../../api-responses";
import type { Inquiry } from "../../../../db/client";
import { prisma } from "../../../../db/client";
import { zodIssuesToBadRequestIssues } from "../../../utils";
import { env } from "../../../../../env/server.mjs";
import inquiries from "../../../../../pages/api/v1/inquiries";
const { Configuration, OpenAIApi } = require("openai");

enum SubscriptionStatus {
  INCOMPLETE,
  INCOMPLETE_EXPIRED,
  TRIALING,
  ACTIVE, 
  PAST_DUE, 
  CANCELED, 
  UNPAID
}

// configure the openai api
const configuration = new Configuration({
  apiKey: env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const BodySchema = z.object({
  connectionType: z.enum(["WEB", "TELEGRAM"]),
  connectionUserId: z.string(),
  userId: z.string(),
  queryType: z.string(),
  query: z.string(),
});

// @TODO: need to edit the response type to a more generic type that provides responses for all types of inquiries
type Res = SuccessRes<Inquiry> | BadRequestRes;

/// POST /api/v1/inquiries
/// An endpoint to create an inquiry
/// This endpoint body will 
/// - send all of the information needed to update the db
/// - validate the user limits and stripe limits
/// - use dust to query the inquiry and return the result
///
/// An example body from a TELEGRAM user would look like this 
/// {
///   "connectionType": "TELEGRAM",
///   "connectionUserId": "DXfTdkXncpw4yF0zDFZ6b"
///   "userID": 1111111111,
///   "queryType": "fitness-trainer" // this is the name of the dust app / persona they want 
///   "query": "I want to get fit" // this is the query they want to ask the dust app / persona
/// }

export async function createInquiry(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {
  // validate the body
  const bodyParse = await BodySchema.spa(req.body);

  // return if the body is invalid
  if (!bodyParse.success) {
    return res.status(400).json({
      code: "BAD_REQUEST",
      message: "Invalid request body",
      issues: zodIssuesToBadRequestIssues(bodyParse.error.issues),
    });
  }

  // parse the body
  const { data: bodyData } = bodyParse;

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
    } catch (error) {
      console.log("Error in creating new connection: " + error)
    }
  } else {
    console.log("User already has a connection")
  }

  // check if connection is null
  if (!connection) {
    return res.status(400).json({
      data: "Error in creating connection",
    })
  }

  // In order to validate a inquiry we
  // - check the users limits
  // - if user is over limit check if they are paying
  // - if they are paying allow the inquiry
  // - if they are not paying return a message saying they have exceeded the limit

  // get the user
  // @TODO we will need to rework the db schema a little bit to allow for generic connections
  const user = await prisma.user.findUnique({
    where: {
      telegramId: bodyData.userId
    }
  })
  // check if user is null 
  if (!user) {
    return res.status(400).json({
      data: "Error in finding user",
    })
  }

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
  const stripeCustomer = await prisma.subscription.findUnique({
    where: {
      id: user.id
    }
  })
  // check if stripeCustomer is null
  if (!stripeCustomer) {
    return res.status(400).json({
      data: "Error in finding stripe customer",
    })
  }

  const subscriptionStatus: SubscriptionStatus = stripeCustomer.status

  // check if the user has exceeded the limit and are paying
  // if not serve a message saying they have exceeded the limit
  if (inquiries.length > env.USER_INQUIRY_LIMIT && (subscriptionStatus !== SubscriptionStatus.ACTIVE && subscriptionStatus !== SubscriptionStatus.TRIALING)) {  
    return res.status(400).json({
      data: "User has exceeded the inquiry limit",
    })
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

    // @TODO: need to format text
    let formattedResponse = response.data.choices[0].text

    // return the response
    res.status(200).json({
      data: formattedResponse,
    });
  } else {
    // hit dust app
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
      console.log("Error in finding persona: " + error)
      return res.status(400).json({
        data: error,
      })
    }

    // check if app is null 
    if (!app) {
      return res.status(400).json({
        data: "Persona not found",
      })
    }

    // break out the app data
    const name = app.name
    const id = app.id
    const specificationHash = app.specificationHash
    const config = JSON.parse(app.config)

    // query the dust app
    const options = {
      method: 'POST',
      body: JSON.stringify({
          "specification_hash": specificationHash,
          "config": config,
          "blocking": true,
          "inputs": [{ "question": bodyData.query }]
      }),
      headers: headers
    }

    // query the dust app
    let data = await fetch(`https://dust.tt/api/v1/apps/Lucas-Kohorst/${id}/runs`, options)
      .then((response) => response.json())
      .catch((error) => {
        return res.status(400).json({
          data: error,
        })
      });
  
    // handle dust api error 
    if (data.error) {
      return res.status(400).json({
        data: data.error,
      })
    }

    // parse the response
    let completion = data.run.results[0][0].value.completion.text

    // return the response
    return res.status(200).json({
      data: completion,
    });
  }
}