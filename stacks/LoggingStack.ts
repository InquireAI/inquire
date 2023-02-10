import { Function, StackContext } from "sst/constructs";
import * as destinations from "aws-cdk-lib/aws-logs-destinations";
import { z } from "zod";

const EnvSchema = z.object({
  GRAFANA_API_KEY: z.string(),
  GRAFANA_USERNAME: z.string(),
  GRAFANA_WRITE_ADDRESS: z.string(),
});

export function LoggingStack({ stack }: StackContext) {
  const env = EnvSchema.parse(process.env);

  const ingesterFunction = new Function(stack, "LogIngester", {
    handler: "services/functions/grafana-promtail/main",
    timeout: "1 minute",
    memorySize: "512 MB",
    environment: {
      EXTRA_LABELS: "",
      KEEP_STREAM: "false",
      PASSWORD: env.GRAFANA_API_KEY,
      USERNAME: env.GRAFANA_USERNAME,
      WRITE_ADDRESS: env.GRAFANA_WRITE_ADDRESS,
    },
  });

  const lambdaDestination = new destinations.LambdaDestination(
    ingesterFunction
  );

  return {
    lambdaDestination,
  };
}
