import type { OpenAIApi } from "openai";

type OpenAIQueryArgs = {
  query: string;
};

class OpenAIError extends Error {}

export const completeInquiryWithOpenAI = async (
  args: OpenAIQueryArgs,
  ctx: {
    openai: OpenAIApi;
  }
) => {
  const result = await ctx.openai.createCompletion({
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
};
