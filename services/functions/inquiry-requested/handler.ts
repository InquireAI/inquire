import { EventBridgeHandler } from "aws-lambda";
import type { InquiryRequested } from "@inquire/schemas/dist/inquiry-requested";
import { processInquiry } from "./controller";
import { Configuration, OpenAIApi } from "openai";
import { env } from "./env";
import { CompleteInquiryHandler } from "../../inquiries/complete-inquiry.interface";
import { completeInquiryWithOpenAI } from "../../inquiries/complete-inquiry-openai";
import { completeInquiryWithDust } from "../../inquiries/complete-inquiry-dust";
import { updateInquiryWithPlanetScale } from "../../inquiries/update-inquiry-planetscale";
import { UpdateInquiryHandler } from "../../inquiries/update-inquiry.interface";
import { connect } from "@planetscale/database";
import { fetch } from "undici";
import { logger } from "../../utils/logger";
import { randomUUID } from "crypto";
import middy from "@middy/core";
import { loggerMiddleware } from "../../middleware/logger-middleware";

export const conn = connect({
  fetch,
  host: env.DATABASE_HOST,
  password: env.DATABASE_PASSWORD,
  username: env.DATABASE_USERNAME,
});

export const openai = new OpenAIApi(
  new Configuration({
    apiKey: env.OPENAI_API_KEY,
  })
);

export const completeInquiry: CompleteInquiryHandler = async (args) => {
  const { id, query, queryType, persona } = args;
  if (!persona) {
    return completeInquiryWithOpenAI({ query: args.query }, { openai });
  } else {
    return completeInquiryWithDust(
      {
        id,
        query,
        queryType,
        persona,
      },
      {
        dustApiKey: env.DUST_API_KEY,
      }
    );
  }
};

export const updateInquiry: UpdateInquiryHandler = (id, args) => {
  return updateInquiryWithPlanetScale(id, args, {
    conn,
  });
};

/* c8 ignore next 22 */
export const handler: EventBridgeHandler<
  "InquiryRequested",
  InquiryRequested,
  void
> = async (event) => {
  logger.setOptions({
    baseLogArgs: { requestId: randomUUID() },
  });
  await processInquiry(
    {
      id: event.detail.id,
      query: event.detail.query,
      queryType: event.detail.queryType,
      persona: event.detail.persona && {
        id: event.detail.persona.id,
        config: event.detail.persona.config,
        specificationHash: event.detail.persona.specificationHash,
      },
    },
    {
      completeInquiry,
      updateInquiry,
    }
  );
};

export const main = middy(handler);

main.use(loggerMiddleware());
