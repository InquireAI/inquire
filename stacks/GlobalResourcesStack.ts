import { StackContext } from "sst/constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export function GlobalResourcesStack({ stack }: StackContext) {
  const vpc = new ec2.Vpc(stack, "GlobalVpc", {
    maxAzs: 2,
  });

  return { vpc };
}
