import type { NextApiResponse } from "next";
import { createConnection } from "@/server/api/v1/controllers/connections/create-connection";
import { withApiKeyAuth } from "@/server/api/with-api-key-auth";
import type { NextApiRequestWithLogger } from "@/server/logger/with-logger";
import { withLogger } from "@/server/logger/with-logger";

async function handler(req: NextApiRequestWithLogger, res: NextApiResponse) {
  if (req.method === "POST") {
    return createConnection(req, res);
  }

  return res.status(400).json({
    code: "BAD_REQUEST",
    message: `Unsupported request method: ${req.method}`,
  });
}

export default withLogger(withApiKeyAuth(handler));
