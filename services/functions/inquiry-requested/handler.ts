import { EventBridgeHandler } from "aws-lambda";
import type { InquiryRequested } from "@inquire/schemas/dist/inquiry-requested";
import { processInquiry } from "./controller";
import { logger } from "../../utils/logger";

export const main: EventBridgeHandler<
  "InquiryRequested",
  InquiryRequested,
  void
> = async (event) => {
  await processInquiry({
    id: event.detail.id,
    query: event.detail.query,
    queryType: event.detail.queryType,
    persona: event.detail.persona && {
      id: event.detail.persona.id,
      config: event.detail.persona.config,
      specificationHash: event.detail.persona.specificationHash,
    },
  });
};
