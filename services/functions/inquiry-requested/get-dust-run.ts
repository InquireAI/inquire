import { Config } from "@serverless-stack/node/config";
import axios from "axios";
import { DustResponse } from "./dust-response";

type Args = {
  personaId: string;
  runId: string;
};

export async function getDustRunById(args: Args) {
  const res = await axios.get(
    `https://dust.tt/api/v1/apps/Lucas-Kohorst/${args.personaId}/runs/${args.runId}`,
    {
      headers: {
        Authorization: `Bearer ${Config.DUST_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data as DustResponse;
}
