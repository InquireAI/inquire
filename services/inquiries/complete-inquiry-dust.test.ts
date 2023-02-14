import { createDustRun } from "../dust/create-dust-run";
import { it, afterAll, describe, vi, expect, Mock } from "vitest";
import { completeInquiryWithDust, DustError } from "./complete-inquiry-dust";
import { getDustRunById } from "../dust/get-dust-run";

vi.mock("../dust/create-dust-run", () => {
  return {
    createDustRun: vi.fn(),
  };
});

vi.mock("../dust/get-dust-run", () => {
  return {
    getDustRunById: vi.fn(),
  };
});

describe("completeInquiryWithDust tests", () => {
  afterAll(() => {
    vi.clearAllMocks();
  });

  it("should throw a new DustError if the status is errored", async () => {
    (createDustRun as Mock).mockResolvedValueOnce({
      run: {
        run_id: "run_id",
        status: {
          run: "running",
        },
      },
    });

    (getDustRunById as Mock).mockResolvedValueOnce({
      run: {
        run_id: "run_id",
        status: {
          run: "errored",
        },
      },
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

  it("should return if status is succeeded", async () => {
    (createDustRun as Mock).mockResolvedValueOnce({
      run: {
        run_id: "run_id",
        status: {
          run: "running",
        },
      },
    });

    (getDustRunById as Mock).mockResolvedValueOnce({
      run: {
        run_id: "run_id",
        status: {
          run: "succeeded",
        },
        results: [
          [
            {
              value: {
                completion: {
                  text: "result",
                },
              },
            },
          ],
        ],
      },
    });

    const result = await completeInquiryWithDust(
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
    expect(result).toEqual("result");
  });
});
