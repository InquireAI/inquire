import { PrismaClient, type Prisma } from "@prisma/client";
import { Chance } from "chance";

const chance = new Chance();
const prisma = new PrismaClient();

async function main() {
  const personas: Prisma.PersonaCreateManyInput[] = [];

  for (let i = 0; i < 100; i++) {
    personas.push({
      id: chance.guid(),
      config: chance.string(),
      name: chance.word({ length: 12 }),
      specificationHash: chance.string(),
      description: chance.sentence(),
      prompt: chance.paragraph(),
    });
  }

  await prisma.persona.createMany({
    data: personas,
  });
}

main();
