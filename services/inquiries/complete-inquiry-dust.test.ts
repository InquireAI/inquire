import { createDustRun } from "../dust/create-dust-run";
import { it, afterAll, describe, vi, expect, Mock } from "vitest";
import { completeInquiryWithDust, DustError } from "./complete-inquiry-dust";
import { getDustRunById } from "../dust/get-dust-run";
import { setTimeoutAsync } from "../utils/set-timeout-async";

vi.mock("../utils/set-timeout-async", () => {
  return {
    setTimeoutAsync: vi.fn(),
  };
});

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

const mockCreateDustRun = createDustRun as Mock;
const mockGetDustRunById = getDustRunById as Mock;

describe("completeInquiryWithDust tests", () => {
  afterAll(() => {
    vi.clearAllMocks();
  });

  it("should throw a new DustError if the status is errored", async () => {
    mockCreateDustRun.mockResolvedValueOnce({
      run: {
        run_id: "run_id",
        status: {
          run: "running",
        },
      },
    });

    mockGetDustRunById.mockResolvedValueOnce({
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
    mockCreateDustRun.mockResolvedValueOnce({
      run: {
        run_id: "run_id",
        status: {
          run: "running",
        },
      },
    });

    mockGetDustRunById.mockResolvedValueOnce({
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

    expect(getDustRunById).toHaveBeenCalledWith(
      {
        personaId: "id",
        runId: "run_id",
      },
      {
        dustApiKey: "dustApiKey",
      }
    );

    expect(result).toEqual("result");
  });

  it("should loop if status is still running", async () => {
    mockCreateDustRun.mockResolvedValueOnce({
      run: {
        run_id: "run_id",
        status: {
          run: "running",
        },
      },
    });

    mockGetDustRunById
      .mockResolvedValueOnce({
        run: {
          run_id: "run_id",
          status: {
            run: "running",
          },
        },
      })
      .mockResolvedValueOnce({
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

    expect(getDustRunById).toHaveBeenNthCalledWith(
      1,
      {
        personaId: "id",
        runId: "run_id",
      },
      { dustApiKey: "dustApiKey" }
    );

    expect(getDustRunById).toHaveBeenNthCalledWith(
      2,
      {
        personaId: "id",
        runId: "run_id",
      },
      { dustApiKey: "dustApiKey" }
    );

    expect(result).toEqual("result");
  });
});
