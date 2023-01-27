import { EventBridgeHandler } from "aws-lambda";

export const main: EventBridgeHandler<"InquiryRequested" | "", {}, {}> = async (
  event
) => {
  console.log(event);
  return {};
};
