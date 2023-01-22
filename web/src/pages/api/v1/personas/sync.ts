import type { NextApiRequest, NextApiResponse } from "next";
import { syncPersonas } from "../../../../server/api/v1/controllers/personas/sync-personas";
import { withApiKeyAuth } from "../../../../server/api/with-api-key-auth";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    return syncPersonas(req, res);
  }

  return res.status(400).json({
    code: "BAD_REQUEST",
    message: `Unsupported requested method: ${req.method}`,
  });
}

export default withApiKeyAuth(handler);
