import { createDustRun } from "../dust/create-dust-run";
import { getDustRunById } from "../dust/get-dust-run";
import { logger } from "../utils/logger";
import { CompleteInquiryHandlerArgs } from "./complete-inquiry.interface";

interface DustQueryArgs extends CompleteInquiryHandlerArgs {
  persona: NonNullable<CompleteInquiryHandlerArgs["persona"]>;
}

export class DustError extends Error {}

function setTimeoutAsync(time: number) {
  return new Promise((r) => setTimeout(r, time));
}

export const completeInquiryWithDust = async (
  args: DustQueryArgs,
  ctx: { dustApiKey: string }
) => {
  try {
    const newRun = await createDustRun(
      {
        config: args.persona.config,
        personaId: args.persona.id,
        query: args.query,
        specificationHash: args.persona.specificationHash,
      },
      {
        dustApiKey: ctx.dustApiKey,
      }
    );

    logger.info(`Created dust run with id: ${newRun.run.run_id}`, {});

    if (newRun.run.status.run === "errored")
      throw new DustError(`Dust run: ${newRun.run.run_id} failed`);

    logger.info(`Polling dust run for status`, {});

    while (true) {
      await setTimeoutAsync(1000);

      const updatedRun = await getDustRunById(
        {
          personaId: args.persona.id,
          runId: newRun.run.run_id,
        },
        {
          dustApiKey: ctx.dustApiKey,
        }
      );

      if (updatedRun.run.status.run === "running") {
        logger.info(`Dust run is running`, {});
        continue;
      }

      if (updatedRun.run.status.run === "succeeded") {
        logger.info(`Dust run succeeded`, {});
        return updatedRun.run.results[0][0].value.completion.text;
      }
    }
  } catch (error) {
    logger.error("Failed to start dust run", { err: error });
    throw error;
  }
};
