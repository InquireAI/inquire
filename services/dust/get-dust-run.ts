import axios from "axios";
import { DustResponse } from "./dust-response";
import { env } from "../functions/inquiry-requested/env";

type Args = {
  personaId: string;
  runId: string;
};

export async function getDustRunById(args: Args, ctx: { dustApiKey: string }) {
  const res = await axios.get(
    `https://dust.tt/api/v1/apps/Lucas-Kohorst/${args.personaId}/runs/${args.runId}`,
    {
      headers: {
        Authorization: `Bearer ${ctx.dustApiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data as DustResponse;
}
