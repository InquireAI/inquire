import { SSTConfig } from "sst";
import { Stack } from "./stacks/Stack";

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

    app.stack(Stack);
  },
} satisfies SSTConfig;
