import { SSTConfig } from "sst";
import { WebStack } from "./stacks/WebStack";
import { GlobalResourcesStack } from "./stacks/GlobalResourcesStack";
import { BotStack } from "./stacks/BotStack";

export default {
  config() {
    return {
      name: "inquire",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.setDefaultFunctionProps({
      runtime: "nodejs16.x",
      nodejs: {
        format: "esm",
      },
    });

    app.stack(GlobalResourcesStack).stack(WebStack).stack(BotStack);
  },
} satisfies SSTConfig;
