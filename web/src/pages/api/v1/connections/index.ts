import type { NextApiRequest, NextApiResponse } from "next";
import { createConnection } from "../../../../server/api/v1/controllers/connections/create-connection";
import { withApiKeyAuth } from "../../../../server/api/with-api-key-auth";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    return createConnection(req, res);
  }

  return res.status(400).json({
    code: "BAD_REQUEST",
    message: `Unsupported request method: ${req.method}`,
  });
}

export default withApiKeyAuth(handler);
