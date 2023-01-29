import { Config } from "@serverless-stack/node/config";
import axios from "axios";
import { Configuration, OpenAIApi } from "openai";

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
  id: string;
  specificationHash: string;
  config: string;
  query: string;
  queryType: string;
};

type DustStatus = "succeeded" | "running" | "errored";

type DustResponse = {
  run: {
    run_id: string;
    created: number;
    run_type: string;
    config: {
      blocks: Record<string, unknown>;
    };
    status: {
      run: DustStatus;
      blocks: [];
    };
    traces: [];
    specification_hash: string;
    results: [
      [
        {
          value: {
            prompt: {
              text: string;
              tokens: [];
              logprobs: number[];
              top_logprobs: number;
            };
            completion: {
              text: string;
              tokens: [];
              logprobs: number[];
              top_logprobs: number;
            };
          };
          error: string;
        }
      ]
    ];
  };
};

class DustError extends Error {}

function setTimeoutAsync(time: number) {
  return new Promise((r) => setTimeout(r, 300));
}

async function getDustResult(args: DustQueryArgs) {
  try {
    const res = await axios.post(
      `https://dust.tt/api/v1/apps/Lucas-Kohorst/${args.id}/runs`,
      {
        specification_hash: args.specificationHash,
        config: JSON.parse(args.config),
        block: false,
        inputs: [{ question: args.query }],
      }
    );

    const run = res.data as DustResponse;

    if (run.run.status.run === "errored")
      throw new DustError(`Dust run: ${run.run.run_id} failed`);

    while (true) {
      await setTimeoutAsync(3000);
      const res = await axios.get(
        `https://dust.tt/api/v1/apps/Lucas-Kohorst/${args.id}/runs/${run.run.run_id}`
      );

      const data = res.data as DustResponse;

      if (data.run.status.run === "running") {
        continue;
      }

      if (data.run.status.run === "succeeded") {
        return data.run.results[0][0].value.completion.text;
      }
    }
  } catch (error) {
    throw new DustError("Failed to start dust run");
  }
}

export async function processInqiury(args: Args) {
  if (!args.persona) {
    const result = await getOpenAIResult({ query: args.query });
    console.log(result);
  } else {
    const result = await getDustResult({
      config: args.persona.config,
      id: args.persona.id,
      query: args.query,
      queryType: args.queryType,
      specificationHash: args.persona.specificationHash,
    });
    console.log(result);
  }
}
