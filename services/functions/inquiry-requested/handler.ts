import { EventBridgeHandler } from "aws-lambda";
import { Config } from "@serverless-stack/node/config";
import type { InquiryRequested } from "@inquire/schemas/dist/inquiry-requested";

export const main: EventBridgeHandler<
  "InquiryRequested",
  InquiryRequested,
  void
> = async (event) => {
  console.log(Config.TEST_SECRET);
  console.log(event);
};
