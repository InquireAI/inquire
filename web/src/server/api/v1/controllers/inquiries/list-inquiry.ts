import type { NextApiRequest, NextApiResponse } from "next";
import type { BadRequestRes, SuccessRes } from "../../../api-responses";
import { env } from "../../../../../env/server.mjs";

type Res = SuccessRes<String> | BadRequestRes;

export async function listInquiry(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {

  const headers = {
    'Authorization': 'Bearer ' + env.DUST_API_KEY,
    'Content-Type': 'application/json'
  }
  
  // query db for all personas available
  let data = await prisma.persona.findMany({ })

  // handle dust api error 
  if (data.error) {
    return res.status(400).json({
      data: data.error,
    })
  }

  return res.status(200).json({
    data: data,
  });
}
