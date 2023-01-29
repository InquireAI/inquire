import { EventBridgeHandler } from "aws-lambda";
import type { InquiryRequested } from "@inquire/schemas/dist/inquiry-requested";
import { processInqiury } from "./controller";

export const main: EventBridgeHandler<
  "InquiryRequested",
  InquiryRequested,
  void
> = async (event) => {
  await processInqiury({
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
