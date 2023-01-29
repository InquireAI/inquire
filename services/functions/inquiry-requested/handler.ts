import { EventBridgeHandler } from "aws-lambda";
import { Config } from "@serverless-stack/node/config";

export const main: EventBridgeHandler<"InquiryRequested", {}, void> = async (
  event
) => {
  console.log(Config.TEST_SECRET);
  console.log(event);
};
