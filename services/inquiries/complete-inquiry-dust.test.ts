import { createDustRun } from "../dust/create-dust-run";
import { it, afterAll, afterEach, describe, vi, expect } from "vitest";
import { completeInquiryWithDust, DustError } from "./complete-inquiry-dust";

describe("completeInquiryWithDust tests", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should throw a new DustError if the status is errored", async () => {
    vi.mock("../dust/create-dust-run", () => {
      return {
        createDustRun: vi.fn().mockResolvedValueOnce({
          run: {
            run_id: "run_id",
            status: {
              run: "errored",
            },
          },
        }),
      };
    });

    try {
      await completeInquiryWithDust(
        {
          id: "id",
          query: "query",
          queryType: "queryType",
          persona: {
            id: "id",
            config: "config",
            specificationHash: "specificationHash",
          },
        },
        {
          dustApiKey: "dustApiKey",
        }
      );
    } catch (error) {
      expect(createDustRun).toHaveBeenCalledWith(
        {
          config: "config",
          personaId: "id",
          query: "query",
          specificationHash: "specificationHash",
        },
        {
          dustApiKey: "dustApiKey",
        }
      );
      expect(error).toBeInstanceOf(DustError);
    }
  });
});
