import {
  Stack as SSTSTack,
  StackContext,
  EventBus,
  Config,
  NextjsSite,
} from "@serverless-stack/resources";
import { aws_iam } from "aws-cdk-lib";
import { z } from "zod";
import { env } from "./env";

const EnvSchema = z.object({
  // db
  DATABASE_URL: z.string(),
  // nextauth
  NEXTAUTH_SECRET: z.string(),
  NEXTAUTH_URL: z.string(),
  // google auth
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  // telegram
  TELEGRAM_SECRET_KEY: z.string(),
  NEXT_PUBLIC_TELEGRAM_BOT_NAME: z.string(),
  // stripe
  STRIPE_API_KEY: z.string(),
  STRIPE_PRICE_ID: z.string(),
  STRIPE_WH_SECRET: z.string(),
  NEXT_PUBLIC_STRIPE_PUB_KEY: z.string(),
  // algolia
  ALGOLIA_ADMIN_KEY: z.string(),
  ALGOLIA_PERSONA_INDEX_NAME: z.string(),
  ALGOLIA_APP_ID: z.string(),
  ALGOLIA_SEARCH_KEY: z.string(),
  NEXT_PUBLIC_ALGOLIA_PERSONA_INDEX_NAME: z.string(),
  NEXT_PUBLIC_ALGOLIA_APP_ID: z.string(),
  NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: z.string(),
  // openai
  OPENAI_API_KEY: z.string(),
  // dust
  DUST_API_KEY: z.string(),
  AWS_IAM_WEB_BACKEND_USER_ARN: z.string(),
});

function getWebUrl(stack: SSTSTack) {
  if (stack.stage === "prod") return `https://inquire.run`;
  else if (stack.stage === "staging") return `https://staging.inquire.run`;
  return undefined;
}

export function Stack({ stack }: StackContext) {
  const env = EnvSchema.parse(process.env);

  const webBackendUser = aws_iam.User.fromUserArn(
    stack,
    "WebBackendUser",
    env.AWS_IAM_WEB_BACKEND_USER_ARN
  );

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
              environment: {
                OPENAI_API_KEY: env.OPENAI_API_KEY,
                DUST_API_KEY: env.DUST_API_KEY,
                DATABASE_URL: env.DATABASE_URL,
              },
            },
          },
        },
      },
    },
  });

  eventBus.cdk.eventBus.grantPutEventsTo(webBackendUser);

  // new NextjsSite(stack, "NextSite", {
  //   path: "web",
  //   environment: {
  //     EVENT_BUS_NAME: eventBus.eventBusName,
  //   },
  //   defaults: {
  //     function: {
  //       permissions: [eventBus],
  //     },
  //   },
  // });
}
