import { StackContext, use } from "sst/constructs";
import { WebStack } from "./WebStack";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { GlobalResourcesStack } from "./GlobalResourcesStack";
import path from "path";
import { z } from "zod";

const EnvSchema = z.object({
  TELEGRAM_API_KEY: z.string(),
  INQUIRE_API_KEY: z.string(),
  AXIOM_TOKEN: z.string(),
  DATABASE_URL: z.string(),
});

export function BotStack({ stack }: StackContext) {
  const env = EnvSchema.parse(process.env);

  const { inquireUrl } = use(WebStack);
  const { vpc } = use(GlobalResourcesStack);

  const cluster = new ecs.Cluster(stack, "BotCluster", {
    vpc,
    capacity: {
      instanceType: new ec2.InstanceType("t3.micro"),
    },
  });

  const taskDef = new ecs.Ec2TaskDefinition(stack, "TaskDef");

  taskDef.addContainer("Container", {
    image: ecs.ContainerImage.fromAsset(path.join(__dirname, "../bots")),
    memoryLimitMiB: 512,
    essential: true,
    environment: {
      TELEGRAM_API_KEY: env.TELEGRAM_API_KEY,
      INQUIRE_API: inquireUrl,
      INQUIRE_API_KEY: env.INQUIRE_API_KEY,
      AXIOM_TOKEN: env.AXIOM_TOKEN,
      DB_URI: env.DATABASE_URL,
    },
  });

  new ecs.Ec2Service(stack, "EC2Service", {
    cluster: cluster,
    taskDefinition: taskDef,
    desiredCount: 1,
    minHealthyPercent: 0,
    maxHealthyPercent: 100,
  });
}
