import {
  StackContext,
  EventBus,
  NextjsSite,
  Function,
  use,
  Bucket,
} from "sst/constructs";
import { z } from "zod";
import {
  OriginRequestHeaderBehavior,
  OriginRequestPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { LoggingStack } from "./LoggingStack";
import * as logs from "aws-cdk-lib/aws-logs";
import * as route53 from "aws-cdk-lib/aws-route53";

const EnvSchema = z.object({
  BASE_URL: z.string().optional(),
  // db
  DATABASE_URL: z.string(),
  DATABASE_HOST: z.string(),
  DATABASE_USERNAME: z.string(),
  DATABASE_PASSWORD: z.string(),
  // nextauth
  NEXTAUTH_SECRET: z.string(),
  NEXTAUTH_URL: z.string(),
  // google auth
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  // github auth
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
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
  // inquire
  USER_INQUIRY_LIMIT: z.string().transform((str) => parseInt(str, 10)),
});

export function WebStack({ stack, app }: StackContext) {
  const env = EnvSchema.parse(process.env);

  const { lambdaDestination } = use(LoggingStack);

  const inquiryRequestedHandler = new Function(
    stack,
    "InquiryRequestedHandler",
    {
      timeout: "1 minute",
      handler: "services/functions/inquiry-requested/handler.main",
      logRetention: "one_month",
      environment: {
        OPENAI_API_KEY: env.OPENAI_API_KEY,
        DUST_API_KEY: env.DUST_API_KEY,
        DATABASE_HOST: env.DATABASE_HOST,
        DATABASE_USERNAME: env.DATABASE_USERNAME,
        DATABASE_PASSWORD: env.DATABASE_PASSWORD,
      },
    }
  );

  inquiryRequestedHandler.logGroup.addSubscriptionFilter("SubscriptionFilter", {
    destination: lambdaDestination,
    filterPattern: logs.FilterPattern.allEvents(),
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
            function: inquiryRequestedHandler,
          },
        },
      },
    },
  });

  const originRequestPolicy = new OriginRequestPolicy(
    stack,
    "NextSiteOriginRequestPolicy",
    {
      headerBehavior: OriginRequestHeaderBehavior.allowList(
        "x-api-key",
        "stripe-signature"
      ),
    }
  );

  const hostedZone = route53.HostedZone.fromLookup(stack, "HostedZone", {
    domainName: "inquire.run",
  });

  const inquireUrl =
    stack.stage === "prod"
      ? "inquire.run"
      : stack.stage === "dev" || stack.stage === "staging"
      ? `${stack.stage}.inquire.run`
      : undefined;

  const defaultEnv = {
    DATABASE_URL: env.DATABASE_URL,
    NODE_ENV: "production",
    EVENT_BUS_NAME: eventBus.eventBusName,
    NEXTAUTH_SECRET: env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET,
    TELEGRAM_SECRET_KEY: env.TELEGRAM_SECRET_KEY,
    STRIPE_API_KEY: env.STRIPE_API_KEY,
    STRIPE_PRICE_ID: env.STRIPE_PRICE_ID,
    STRIPE_WH_SECRET: env.STRIPE_WH_SECRET,
    USER_INQUIRY_LIMIT: env.USER_INQUIRY_LIMIT.toString(),
    ALGOLIA_ADMIN_KEY: env.ALGOLIA_ADMIN_KEY,
    ALGOLIA_PERSONA_INDEX_NAME: env.ALGOLIA_PERSONA_INDEX_NAME,
    ALGOLIA_APP_ID: env.ALGOLIA_APP_ID,
    ALGOLIA_SEARCH_KEY: env.ALGOLIA_SEARCH_KEY,
    NEXT_PUBLIC_STRIPE_PUB_KEY: env.NEXT_PUBLIC_STRIPE_PUB_KEY,
    NEXT_PUBLIC_ALGOLIA_PERSONA_INDEX_NAME:
      env.NEXT_PUBLIC_ALGOLIA_PERSONA_INDEX_NAME,
    NEXT_PUBLIC_ALGOLIA_APP_ID: env.NEXT_PUBLIC_ALGOLIA_APP_ID,
    NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY,
    NEXT_PUBLIC_TELEGRAM_BOT_NAME: env.NEXT_PUBLIC_TELEGRAM_BOT_NAME,
  };

  const nextSite = new NextjsSite(stack, "NextSite", {
    path: "web",
    environment: inquireUrl
      ? {
          BASE_URL: inquireUrl,
          ...defaultEnv,
        }
      : env.BASE_URL
      ? {
          BASE_URL: env.BASE_URL,
          ...defaultEnv,
        }
      : defaultEnv,
    permissions: [eventBus],
    customDomain: inquireUrl
      ? {
          domainName: inquireUrl,
          domainAlias: stack.stage === "prod" ? "www.inquire.run" : undefined,
          cdk: {
            hostedZone,
          },
        }
      : undefined,
    cdk: {
      distribution: {
        defaultBehavior: {
          originRequestPolicy,
        },
      },
    },
  });

  if (app.mode === "deploy") {
    nextSite.cdk.function?.logGroup.addSubscriptionFilter(
      "SubscriptionFilter",
      {
        destination: lambdaDestination,
        filterPattern: logs.FilterPattern.allEvents(),
      }
    );
  }

  return {
    inquireUrl: `https://${inquireUrl}` || nextSite.url || undefined,
    nextSite,
    eventBus,
  };
}
