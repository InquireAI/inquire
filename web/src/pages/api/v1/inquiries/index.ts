import type { NextApiResponse } from "next";
// import { createInquiry } from "../../../../server/api/v1/controllers/inquiries/create-inquiry";
import { listInquiry } from "../../../../server/api/v1/controllers/inquiries/list-inquiry";
import { withApiKeyAuth } from "../../../../server/api/with-api-key-auth";
import { eventEmitter } from "../../../../server/eventEmitter/event-bridge-event-emitter";
import type { NextApiRequestWithLogger } from "../../../../server/logger/with-logger";
import { withLogger } from "../../../../server/logger/with-logger";

async function handler(req: NextApiRequestWithLogger, res: NextApiResponse) {
  if (req.method === "POST") {
    const results = await eventEmitter.emit([
      {
        eventType: "InquiryRequested",
        payload: {
          test: "payload",
        },
        source: "com.inquire.web",
      },
    ]);
    req.logger.debug("emitted inquiry requested", results);
    return res.status(200).json({});
  }

  if (req.method === "GET") {
    return listInquiry(req, res);
  }

  return res.status(400).json({
    code: "BAD_REQUEST",
    message: `Unsupported request method: ${req.method}`,
  });
}

export default withLogger(withApiKeyAuth(handler));
