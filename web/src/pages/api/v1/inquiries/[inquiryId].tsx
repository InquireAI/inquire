import type { NextApiResponse } from "next";
import { z } from "zod";
import type {
  BadRequestRes,
  NotFoundRes,
  SuccessRes,
  ValidationIssue,
} from "../../../../server/api/api-responses";
import { zodIssuesToValidationIssues } from "../../../../server/api/utils";
import { updateInquiry } from "../../../../server/api/v1/controllers/inquiries/update-inquiry";
import { withApiKeyAuth } from "../../../../server/api/with-api-key-auth";
import type { Logger } from "../../../../server/logger";
import type { NextApiRequestWithLogger } from "../../../../server/logger/with-logger";
import { withLogger } from "../../../../server/logger/with-logger";
import type { Inquiry } from "../../../../server/db/client";
import { getInquiryById } from "../../../../server/api/v1/controllers/inquiries/get-inquiry-by-id";

const PatchBodySchema = z.object({
  status: z.enum(["REQUESTED", "FAILED", "COMPLETED"]).optional(),
  result: z.string().optional(),
});

async function validatePatchBody(
  body: unknown,
  ctx: { logger: Logger }
): Promise<
  | { success: true; data: z.infer<typeof PatchBodySchema> }
  | { success: false; issues: ValidationIssue[] }
> {
  const parseResult = await PatchBodySchema.spa(body);

  if (!parseResult.success) {
    ctx.logger.info(
      `Invalid request body: ${JSON.stringify(parseResult.error.issues)}`,
      {
        type: "BAD_REQUEST",
        error: parseResult.error,
      }
    );

    return {
      success: false,
      issues: zodIssuesToValidationIssues(parseResult.error.issues),
    };
  }

  ctx.logger.info(`Valid request body`);
  return { success: true, data: parseResult.data };
}

type Res = SuccessRes<Inquiry> | BadRequestRes | NotFoundRes;

async function handler(
  req: NextApiRequestWithLogger,
  res: NextApiResponse<Res>
) {
  const { inquiryId } = req.query as { inquiryId: string };

  if (req.method === "PATCH") {
    const parseResult = await validatePatchBody(req.body, {
      logger: req.logger,
    });

    if (!parseResult.success)
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: "Invalid request body",
        issues: parseResult.issues,
      });

    const inquiry = await updateInquiry(inquiryId, {
      result: parseResult.data.result,
      status: parseResult.data.status,
    });

    return res.status(200).json({
      data: inquiry,
    });
  }

  if (req.method === "GET") {
    const inquiry = await getInquiryById(inquiryId);

    if (!inquiry)
      return res.status(404).json({
        code: "NOT_FOUND",
        message: `Inquiry with id: ${inquiryId} not found`,
      });

    return res.status(200).json({
      data: inquiry,
    });
  }

  return res.status(400).json({
    code: "BAD_REQUEST",
    message: `Unsupported request method: ${req.method}`,
  });
}

export default withLogger(withApiKeyAuth(handler));
