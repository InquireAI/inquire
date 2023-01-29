import { createNextApiHandler } from "@trpc/server/adapters/next/index.js";

import { env } from "../../../env/server.mjs";
import { withLogger } from "../../../server/logger/with-logger";
import { createContext } from "../../../server/trpc/context";
import { appRouter } from "../../../server/trpc/router/_app";

// export API handler
export default withLogger(
  createNextApiHandler({
    router: appRouter,
    createContext,
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(`❌ tRPC failed on ${path}: ${error}`);
          }
        : undefined,
  })
);
