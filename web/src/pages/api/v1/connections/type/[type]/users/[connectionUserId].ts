import type { NextApiRequest, NextApiResponse } from "next";
import { getConnectionByTypeAndUser } from "../../../../../../../server/api/v1/controllers/connections/get-connection-by-type-and-user";
import { withApiKeyAuth } from "../../../../../../../server/api/with-api-key-auth";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return getConnectionByTypeAndUser(req, res);
  }

  return res.status(400).json({
    code: "BAD_REQUEST",
    message: `Unsupported request method: ${req.method}`,
  });
}

export default withApiKeyAuth(handler);
