import { StackContext } from "sst/constructs";
import * as destinations from "aws-cdk-lib/aws-logs-destinations";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { z } from "zod";
import path from "path";
import { Duration } from "aws-cdk-lib";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";

const EnvSchema = z.object({
  GRAFANA_API_KEY: z.string(),
  GRAFANA_USERNAME: z.string(),
  GRAFANA_WRITE_ADDRESS: z.string(),
});

export function LoggingStack({ stack }: StackContext) {
  const env = EnvSchema.parse(process.env);

  const ingesterFunction = new lambda.Function(stack, "LogIngester", {
    runtime: lambda.Runtime.GO_1_X,
    code: lambda.Code.fromAsset(
      path.join(
        path.resolve(),
        "./services/functions/grafana-promtail/main.zip"
      )
    ),
    handler: "main",
    memorySize: 512,
    timeout: Duration.minutes(1),
    environment: {
      EXTRA_LABELS: "",
      KEEP_STREAM: "false",
      PASSWORD: env.GRAFANA_API_KEY,
      USERNAME: env.GRAFANA_USERNAME,
      WRITE_ADDRESS: env.GRAFANA_WRITE_ADDRESS,
    },
  });

  ingesterFunction.addPermission("CloudwatchLogGroupInvoke", {
    principal: new ServicePrincipal("logs.amazonaws.com"),
    action: "lambda:InvokeFunction",
    sourceArn: `arn:aws:logs:us-east-1:${stack.account}:log-group:*:*`,
  });

  const lambdaDestination = new destinations.LambdaDestination(
    ingesterFunction
  );

  return {
    lambdaDestination,
  };
}
