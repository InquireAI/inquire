import { EventBridgeHandler } from "aws-lambda";
import { ssm } from "../../middlewares/ssm";

export const main: EventBridgeHandler<"InquiryRequested", {}, void> = async (
  event
) => {
  console.log(event);
};
