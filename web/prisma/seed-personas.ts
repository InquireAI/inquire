import { PrismaClient, type Prisma } from "@prisma/client";
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

const prisma = new PrismaClient();

async function main() {
  const personasBuffer = await readFile(join(__dirname, "../../dust/db.json"));
  const personasJson = JSON.parse(personasBuffer.toString()) as PersonaFile;

  const personasInput: Prisma.PersonaCreateManyInput[] = [];

  for (const persona of personasJson.personas) {
    personasInput.push({
      id: persona.id,
      config: persona.config,
      description: persona.Description,
      name: persona.Name,
      prompt: persona.Prompt,
      specificationHash: persona.specification_hash,
    });
  }

  await prisma.persona.deleteMany({});

  await prisma.persona.createMany({
    data: personasInput,
  });
}

main();
