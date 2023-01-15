import * as dotenv from "dotenv";
import algoliasearch from "algoliasearch";
import { PrismaClient, type Persona } from "@prisma/client";
import type { BaseHit } from "instantsearch.js";

dotenv.config();

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID as string,
  process.env.ALGOLIA_ADMIN_KEY as string
);

const prisma = new PrismaClient();

interface AlgoliaPersona extends BaseHit {
  objectID: string;
  id: string;
  name: string;
  prompt: string;
  description: string;
}

async function main() {
  const personasIndex = client.initIndex("dev_personas");

  let nextToken: string | undefined = undefined;

  let personas: Persona[] = [];

  while (true) {
    const personaBatch = await prisma.persona.findMany({
      where: {
        id: nextToken && {
          gte: nextToken,
        },
      },
      orderBy: {
        id: "asc",
      },
      take: 79,
    });

    if (personaBatch.length) {
      const lastPersona = personaBatch[personaBatch.length - 1] as Persona;
      const nextPersona = await prisma.persona.findFirst({
        where: {
          id: {
            gt: lastPersona.id,
          },
        },
        take: 500,
      });
      if (nextPersona) nextToken = nextPersona.id;
      else break;
    }

    personas = personas.concat(personaBatch);
  }

  await personasIndex.saveObjects(
    personas.map((p) => {
      return {
        objectID: p.id,
        id: p.id,
        description: p.description,
        name: p.name,
        prompt: p.prompt,
      } satisfies AlgoliaPersona;
    })
  );
}

main();
