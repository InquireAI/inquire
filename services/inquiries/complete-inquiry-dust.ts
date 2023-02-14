import { setTimeoutAsync } from "../utils/set-timeout-async";
import { createDustRun } from "../dust/create-dust-run";
import { getDustRunById } from "../dust/get-dust-run";
import { logger } from "../utils/logger";
import { CompleteInquiryHandlerArgs } from "./complete-inquiry.interface";

interface DustQueryArgs extends CompleteInquiryHandlerArgs {
  persona: NonNullable<CompleteInquiryHandlerArgs["persona"]>;
}

export class DustError extends Error {}

const MAX_RETRY_TIME = 25_000;

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

    logger.info(`Polling dust run for status`, {});

    const startTime = new Date().getTime();

    let reqNum = 0;
    let waitTime = Math.random() * 1000;

    // retry with exponential backoff until we've retried
    // for more than 25 seconds
    while (new Date().getTime() - startTime < MAX_RETRY_TIME) {
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

        await setTimeoutAsync(waitTime);

        reqNum += 1;
        waitTime += Math.pow(2, reqNum) * Math.random() * 1000;

        continue;
      }

      if (updatedRun.run.status.run === "errored")
        throw new DustError(`Dust run: ${newRun.run.run_id} failed`);

      if (updatedRun.run.status.run === "succeeded") {
        logger.info(`Dust run succeeded`, {});
        return updatedRun.run.results[0][0].value.completion.text;
      }
    }
  } catch (error) {
    logger.error("Dust run failed", { err: error });
    if (error instanceof DustError) throw error;
    throw new DustError("Dust run failed");
  }
};
