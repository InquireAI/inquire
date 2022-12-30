import type { NextApiRequest, NextApiResponse } from "next";
import { createInquiry } from "../../../../server/api/v1/controllers/inquiries/create-inquiry";
import { listInquiry } from "../../../../server/api/v1/controllers/inquiries/list-inquiry";
import { withApiKeyAuth } from "../../../../server/api/with-api-key-auth";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    return createInquiry(req, res);
  }

  if (req.method === "GET") {
    return listInquiry(req, res);
  }

  return res.status(400).json({
    code: "BAD_REQUEST",
    message: `Unsupported request method: ${req.method}`,
  });
}

export default withApiKeyAuth(handler);
