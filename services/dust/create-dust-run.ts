import axios from "axios";
import { DustResponse } from "./dust-response";

type Args = {
  personaId: string;
  specificationHash: string;
  config: string;
  query: string;
};

export async function createDustRun(args: Args, ctx: { dustApiKey: string }) {
  const res = await axios.post(
    `https://dust.tt/api/v1/apps/Lucas-Kohorst/${args.personaId}/runs`,
    {
      specification_hash: args.specificationHash,
      config: JSON.parse(args.config),
      block: false,
      inputs: [{ question: args.query }],
    },
    {
      headers: {
        Authorization: `Bearer ${ctx.dustApiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data as DustResponse;
}
