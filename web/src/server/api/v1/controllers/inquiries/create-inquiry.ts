import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import type { BadRequestRes, SuccessRes } from "../../../api-responses";
import type { Inquiry } from "../../../../db/client";
import { prisma } from "../../../../db/client";
import { zodIssuesToBadRequestIssues } from "../../../utils";
import { env } from "../../../../../env/server.mjs";
const { Configuration, OpenAIApi } = require("openai");

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
/// @TODO: do we want to add in fields that would be useful for the `User` table in cases a user uses a connection before signing up for the app? Or do we want to keep all information from the connection in the `Inquiry` table?

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

  // check if the user has any connections first

  // if not update the `User` and associated `Connection` table
  // if not create a row in the db for the user connection
  const inquiry = await prisma.inquiry.create({
    data: {
      connectionType: bodyData.connectionType,
      connectionUserId: bodyData.connectionUserId,
    },
  });

  // update `Connection` table with userId etc

  // check the users limits

  // if > limit check stripe payments

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

    res.status(200).json({
      data: formattedResponse,
    });
  } else {
    // hit dust app
    const headers = {
      'Authorization': 'Bearer ' + env.DUST_API_KEY,
      'Content-Type': 'application/json'
    }

    // list dust apps and find the id for the queryType 
    let appList = await fetch("https://dust.tt/api/v1/apps/Lucas-Kohorst", {headers})
      .then((response) => response.json())
      .catch((error) => {
        return res.status(400).json({
          data: error,
        })
      });

    let id = appList.find(a => a.name === bodyData.queryType)
    
    /// Example Body 
    /// @TODO: need to check what stays the same across these queries and what changes
    // {
    //   "specification_hash": "2d4f4560e7fc1f2c19870bc2989a2530f293946373ac105f35e70f278281f4ef",
    //   "config": {"GOOGLE_SEARCH":{"provider_id":"serpapi","use_cache":true},"MODEL_ANSWER_WITH_REFS":{"provider_id":"openai","model_id":"text-davinci-002","use_cache":true},"WEBCONTENT":{"provider_id":"browserlessapi","use_cache":true},"MODEL_SUMMARIZE":{"provider_id":"openai","model_id":"text-davinci-002","use_cache":true}},
    //   "blocking": true,
    //   "inputs": [{ "question": "what are some supplements for weight loss that are under $100?" }]
    // }

    // query the dust app
    const options = {
      method: 'POST',
      body: JSON.stringify({
        "specification_hash": id.specification_hash,
      }),
      headers: headers
    }

    let data = await fetch("https://dust.tt/api/v1/apps/Lucas-Kohorst", options)
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
  }

  return res.status(200).json({
    data: inquiry,
  });
}
