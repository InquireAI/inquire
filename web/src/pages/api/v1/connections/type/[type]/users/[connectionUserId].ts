import type { NextApiResponse } from "next";
import { getConnectionByTypeAndUser } from "@/server/api/v1/controllers/connections/get-connection-by-type-and-user";
import { withApiKeyAuth } from "@/server/api/with-api-key-auth";
import type { NextApiRequestWithLogger } from "@/server/logger/with-logger";
import { withLogger } from "@/server/logger/with-logger";

async function handler(req: NextApiRequestWithLogger, res: NextApiResponse) {
  if (req.method === "GET") {
    return getConnectionByTypeAndUser(req, res);
  }

  return res.status(400).json({
    code: "BAD_REQUEST",
    message: `Unsupported request method: ${req.method}`,
  });
}

export default withLogger(withApiKeyAuth(handler));
