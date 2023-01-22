import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { log } from "../../../../log";
import type { BadRequestRes, SuccessRes } from "../../../api-responses";
import { zodIssuesToBadRequestIssues } from "../../../utils";
import { prisma } from "../../../../db/client";
import type { AlgoliaPersona } from "../../../../algolia/client";
import { algolia } from "../../../../algolia/client";
import { env } from "../../../../../env/server.mjs";

type Res = SuccessRes<{ success: boolean }> | BadRequestRes;

const BodySchema = z.object({
  personas: z.array(
    z.object({
      Name: z.string(),
      Prompt: z.string(),
      Description: z.string(),
      id: z.string(),
      specification_hash: z.string(),
      config: z.string(),
    })
  ),
});

export async function syncPersonas(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {
  const bodyParse = await BodySchema.spa(req.body);

  if (!bodyParse.success) {
    log.error("Invalid request body", {
      type: "BAD_REQUEST",
      error: bodyParse.error.format(),
    });
    return res.status(400).json({
      code: "BAD_REQUEST",
      message: "Invalid request body",
      issues: zodIssuesToBadRequestIssues(bodyParse.error.issues),
    });
  }

  await prisma.persona.deleteMany({});

  await prisma.persona.createMany({
    data: bodyParse.data.personas.map((persona) => {
      return {
        id: persona.id,
        config: persona.config,
        description: persona.Description,
        name: persona.Name,
        prompt: persona.Prompt,
        specificationHash: persona.specification_hash,
      };
    }),
  });

  const personasIndex = algolia.initIndex(env.ALGOLIA_PERSONA_INDEX_NAME);

  await personasIndex.clearObjects();

  await personasIndex.saveObjects(
    bodyParse.data.personas.map((persona) => {
      return {
        objectID: persona.id,
        id: persona.id,
        description: persona.Description,
        name: persona.Name,
        prompt: persona.Prompt,
      } satisfies AlgoliaPersona;
    })
  );

  return res.status(200).json({
    data: {
      success: true,
    },
  });
}
