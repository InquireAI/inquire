import { Config } from "@serverless-stack/node/config";
import { Configuration, OpenAIApi } from "openai";
import { createDustRun } from "./create-dust-run";
import { getDustRunById } from "./get-dust-run";
import { updateInquiry } from "./update-inquiry";
import { logger } from "../../utils/logger";

type Args = {
  id: string;
  queryType: string;
  query: string;
  persona?: {
    id: string;
    config: string;
    specificationHash: string;
  };
};

const openai = new OpenAIApi(
  new Configuration({
    apiKey: Config.OPENAI_API_KEY,
  })
);

class OpenAIError extends Error {}

type OpenAIQueryArgs = {
  query: string;
};

async function getOpenAIResult(args: OpenAIQueryArgs) {
  const result = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: args.query,
    temperature: 0.9,
    max_tokens: 2000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0.6,
  });

  if (!result.data.choices[0].text) {
    throw new OpenAIError("OpenAI response is missing");
  }

  return result.data.choices[0].text;
}

type DustQueryArgs = {
  personaId: string;
  specificationHash: string;
  config: string;
  query: string;
  queryType: string;
};

class DustError extends Error {}

function setTimeoutAsync(time: number) {
  return new Promise((r) => setTimeout(r, time));
}

async function getDustResult(args: DustQueryArgs) {
  try {
    const newRun = await createDustRun({
      config: args.config,
      personaId: args.personaId,
      query: args.query,
      specificationHash: args.specificationHash,
    });

    logger.info(`Created dust run with id: ${newRun.run.run_id}`, {});

    if (newRun.run.status.run === "errored")
      throw new DustError(`Dust run: ${newRun.run.run_id} failed`);

    logger.info(`Polling dust run for status`, {});
    while (true) {
      await setTimeoutAsync(1000);

      const updatedRun = await getDustRunById({
        personaId: args.personaId,
        runId: newRun.run.run_id,
      });

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
}

export async function processInquiry(args: Args) {
  try {
    if (!args.persona) {
      const result = await getOpenAIResult({ query: args.query });
      await updateInquiry(args.id, {
        status: "COMPLETED",
        result,
      });
    } else {
      const result = await getDustResult({
        config: args.persona.config,
        personaId: args.persona.id,
        query: args.query,
        queryType: args.queryType,
        specificationHash: args.persona.specificationHash,
      });
      await updateInquiry(args.id, {
        status: "COMPLETED",
        result,
      });
    }
  } catch (error) {
    await updateInquiry(args.id, {
      status: "FAILED",
    });

    throw error;
  }
}
