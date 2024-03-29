import { StackContext, use } from "sst/constructs";
import { WebStack } from "./WebStack";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { GlobalResourcesStack } from "./GlobalResourcesStack";
import path from "path";
import { z } from "zod";
import * as logs from "aws-cdk-lib/aws-logs";
import { LoggingStack } from "./LoggingStack";

const EnvSchema = z.object({
  TELEGRAM_API_KEY: z.string(),
  INQUIRE_API_KEY: z.string(),
  DB_URI: z.string(),
});

export function BotStack({ stack }: StackContext) {
  const env = EnvSchema.parse(process.env);

  const { inquireUrl } = use(WebStack);
  const { vpc } = use(GlobalResourcesStack);
  const { lambdaDestination } = use(LoggingStack);

  const cluster = new ecs.Cluster(stack, "BotCluster", {
    vpc,
    capacity: {
      instanceType: new ec2.InstanceType("t3.micro"),
    },
  });

  const taskDef = new ecs.Ec2TaskDefinition(stack, "TaskDef");

  const logGroup = new logs.LogGroup(stack, "ContainerLogs", {
    retention: logs.RetentionDays.ONE_MONTH,
  });

  logGroup.addSubscriptionFilter("SubscriptionFilter", {
    destination: lambdaDestination,
    filterPattern: logs.FilterPattern.allEvents(),
  });

  taskDef.addContainer("Container", {
    image: ecs.ContainerImage.fromAsset(path.join(path.resolve(), "./bots")),
    memoryLimitMiB: 512,
    essential: true,
    environment: {
      TELEGRAM_API_KEY: env.TELEGRAM_API_KEY,
      INQUIRE_API: `${inquireUrl}/api/v1` || `https://dev.inquire.run/api/v1`,
      INQUIRE_API_KEY: env.INQUIRE_API_KEY,
      DB_URI: env.DB_URI,
    },
    logging: ecs.LogDriver.awsLogs({
      streamPrefix: "bots",
      logGroup,
    }),
  });

  new ecs.Ec2Service(stack, "EC2Service", {
    cluster: cluster,
    taskDefinition: taskDef,
    desiredCount: 1,
    minHealthyPercent: 0,
    maxHealthyPercent: 100,
  });
}
