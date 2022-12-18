import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import type { BadRequestRes, SuccessRes } from "../../../api-responses";
import type { Inquiry } from "../../../../db/client";
import { prisma } from "../../../../db/client";
import { zodIssuesToBadRequestIssues } from "../../../utils";

const BodySchema = z.object({
  connectionType: z.enum(["WEB", "TELEGRAM"]),
  connectionUserId: z.string(),
});

type Res = SuccessRes<Inquiry> | BadRequestRes;

export async function createInquiry(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {
  const bodyParse = await BodySchema.spa(req.body);

  if (!bodyParse.success) {
    return res.status(400).json({
      code: "BAD_REQUEST",
      message: "Invalid request body",
      issues: zodIssuesToBadRequestIssues(bodyParse.error.issues),
    });
  }

  const { data: bodyData } = bodyParse;

  const inquiry = await prisma.inquiry.create({
    data: {
      connectionType: bodyData.connectionType,
      connectionUserId: bodyData.connectionUserId,
    },
  });

  return res.status(200).json({
    data: inquiry,
  });
}
