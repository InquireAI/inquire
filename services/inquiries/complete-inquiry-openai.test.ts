import { OpenAIApi } from "openai";
import { describe, expect, it, vi } from "vitest";
import {
  completeInquiryWithOpenAI,
  OpenAIError,
} from "./complete-inquiry-openai";

describe("completeInquiryWithOpenAI tests", () => {
  it("return result is createComplete succeeds", async () => {
    const ctx = {
      openai: {
        createCompletion: vi.fn().mockResolvedValueOnce({
          data: {
            choices: [
              {
                text: "result",
              },
            ],
          },
        }),
      } as unknown as OpenAIApi,
    };

    const result = await completeInquiryWithOpenAI({ query: "query" }, ctx);

    expect(ctx.openai.createCompletion).toHaveBeenCalledWith({
      model: "text-davinci-003",
      prompt: "query",
      temperature: 0.9,
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0.6,
    });
    expect(result).toEqual("result");
  });

  it("return result if createComplete fails", async () => {
    const mockError = new Error("Create Completion Error");

    const ctx = {
      openai: {
        createCompletion: vi.fn().mockRejectedValueOnce(mockError),
      } as unknown as OpenAIApi,
    };

    try {
      await completeInquiryWithOpenAI({ query: "query" }, ctx);
    } catch (error) {
      expect(error).toBeInstanceOf(OpenAIError);
      expect(ctx.openai.createCompletion).toHaveBeenCalledWith({
        model: "text-davinci-003",
        prompt: "query",
        temperature: 0.9,
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
      });
    }
  });

  it("return result if createComplete response text is empty", async () => {
    const mockError = new Error("Create Completion Error");

    const ctx = {
      openai: {
        createCompletion: vi.fn().mockResolvedValueOnce({
          data: {
            choices: [
              {
                text: undefined,
              },
            ],
          },
        }),
      } as unknown as OpenAIApi,
    };

    try {
      await completeInquiryWithOpenAI({ query: "query" }, ctx);
    } catch (error) {
      expect(error).toBeInstanceOf(OpenAIError);
      expect(ctx.openai.createCompletion).toHaveBeenCalledWith({
        model: "text-davinci-003",
        prompt: "query",
        temperature: 0.9,
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
      });
    }
  });
});
