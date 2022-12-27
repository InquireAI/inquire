import type { NextApiRequest, NextApiResponse } from "next";
import type { BadRequestRes, SuccessRes, DatabaseError } from "../../../api-responses";
import { env } from "../../../../../env/server.mjs";
import { Persona } from "@prisma/client";

// configure logger
const logger = require('consola')

type Res = SuccessRes<Persona[]> | DatabaseError;

export async function listInquiry(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {

  const headers = {
    'Authorization': 'Bearer ' + env.DUST_API_KEY,
    'Content-Type': 'application/json'
  }
  
  // check if prisma exists 
  if (!prisma) {
    logger.error(`Prisma does not exist`)
    return res.status(400).json({
      code: "DATABASE_ERROR",
      message: `Database Error`,
    })
  }
  
  // query db for all personas available
  let data = await prisma.persona.findMany({ })

  // handle db query error
  if (!data) {
    logger.error(`Error querying db for personas`)
    return res.status(400).json({
      code: "DATABASE_ERROR",
      message: `Databse Error`,
    })
  }

  logger.success(`Successfully queried db for personas`)
  return res.status(200).json({
    data: data,
  });
}
