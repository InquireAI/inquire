import middy from "@middy/core";
import { EventBridgeHandler } from "aws-lambda";
import { ssm } from "../../middlewares/ssm";

export const handler: EventBridgeHandler<"InquiryRequested", {}, void> = async (
  event
) => {
  console.log(event);
};

export const main = middy(handler);

main.use(ssm({}));
