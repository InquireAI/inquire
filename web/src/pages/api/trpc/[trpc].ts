import { createNextApiHandler } from "@trpc/server/adapters/next";

import { env } from "@/env/server.mjs";
import { withLogger } from "@/server/logger/with-logger";
import { createContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/router/_app";

// export API handler
export default withLogger(
  createNextApiHandler({
    router: appRouter,
    createContext,
    onError: ({ path, error, ctx }) => {
      if (!ctx) console.error(`tRPC failed on ${path}: ${error}`);
      else ctx.logger.error(`tRPC failed on ${path}`, { err: error });
    },
  })
);
