import { StackContext, EventBus } from "@serverless-stack/resources";

export function Stack({ stack }: StackContext) {
  new EventBus(stack, "EventBus", {
    rules: {
      inquiryRequested: {
        pattern: {
          source: ["com.inquire.web"],
          detailType: ["InquiryRequested"],
        },
        targets: {
          inquiryRequestedHandler: "functions/inquiry-requested/handler.main",
        },
      },
    },
  });
}
