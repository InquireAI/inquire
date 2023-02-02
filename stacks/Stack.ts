import {
  Stack as SSTSTack,
  StackContext,
  EventBus,
  Config,
} from "@serverless-stack/resources";
import { aws_iam } from "aws-cdk-lib";
import { env } from "./env";

type Env = {
  AWS_IAM_WEB_BACKEND_USER_ARN: string;
  INQUIRE_URL: string;
};

function getEnv(stack: SSTSTack): Env {
  if (stack.stage !== "prod" && stack.stage !== "staging") {
    return process.env as Env;
  }
  return env[stack.stage];
}

export function Stack({ stack }: StackContext) {
  const env = getEnv(stack);

  const webBackendUser = aws_iam.User.fromUserArn(
    stack,
    "WebBackendUser",
    env.AWS_IAM_WEB_BACKEND_USER_ARN
  );

  const OPENAI_API_KEY = new Config.Secret(stack, "OPENAI_API_KEY");
  const DUST_API_KEY = new Config.Secret(stack, "DUST_API_KEY");
  const INQUIRE_API_KEY = new Config.Secret(stack, "INQUIRE_API_KEY");
  const INQUIRE_URL = new Config.Parameter(stack, "INQUIRE_URL", {
    value: env.INQUIRE_URL,
  });

  const eventBus = new EventBus(stack, "EventBus", {
    rules: {
      inquiryRequested: {
        pattern: {
          source: ["com.inquire.web"],
          detailType: ["InquiryRequested"],
        },
        targets: {
          inquiryRequestedHandler: {
            function: {
              timeout: "30 seconds",
              handler: "functions/inquiry-requested/handler.main",
              bind: [
                OPENAI_API_KEY,
                DUST_API_KEY,
                INQUIRE_API_KEY,
                INQUIRE_URL,
              ],
            },
          },
        },
      },
    },
  });

  eventBus.cdk.eventBus.grantPutEventsTo(webBackendUser);
}
