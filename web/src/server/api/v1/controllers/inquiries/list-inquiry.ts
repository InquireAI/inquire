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
  
  let data = await fetch("https://dust.tt/api/v1/apps/Lucas-Kohorst", {headers})
    .then((response) => response.json())
    .catch((error) => {
      return res.status(400).json({
        data: error,
      })
    });

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
