import * as dotenv from "dotenv";
import algoliasearch from "algoliasearch";
import type { BaseHit } from "instantsearch.js";
import { readFile } from "fs/promises";
import { join } from "path";

type Persona = {
  Name: string;
  Prompt: string;
  Description: string;
  id: string;
  specification_hash: string;
  config: string;
};

type PersonaFile = {
  personas: Persona[];
};

dotenv.config();

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID as string,
  process.env.ALGOLIA_ADMIN_KEY as string
);

interface AlgoliaPersona extends BaseHit {
  objectID: string;
  id: string;
  name: string;
  prompt: string;
  description: string;
}

async function main() {
  const personasBuffer = await readFile(join(__dirname, "../../dust/db.json"));
  const personasJson = JSON.parse(personasBuffer.toString()) as PersonaFile;

  const personasIndex = client.initIndex("dev_personas");

  await personasIndex.clearObjects();

  await personasIndex.saveObjects(
    personasJson.personas.map((p) => {
      return {
        objectID: p.id,
        id: p.id,
        description: p.Description,
        name: p.Name,
        prompt: p.Prompt,
      } satisfies AlgoliaPersona;
    })
  );
}

main();
