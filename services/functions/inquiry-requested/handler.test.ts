import { describe, vi, it, expect } from "vitest";
import { completeInquiry, updateInquiry, openai, conn } from "./handler";
import { completeInquiryWithOpenAI } from "../../inquiries/complete-inquiry-openai";
import { completeInquiryWithDust } from "../../inquiries/complete-inquiry-dust";
import { updateInquiryWithPlanetScale } from "../../inquiries/update-inquiry-planetscale";
import { Inquiry } from "../../inquiries/update-inquiry.interface";
import { env } from "./env";

vi.mock("../../inquiries/complete-inquiry-openai", () => {
  return {
    completeInquiryWithOpenAI: vi.fn().mockResolvedValueOnce("mock result"),
  };
});

vi.mock("../../inquiries/complete-inquiry-dust", () => {
  return {
    completeInquiryWithDust: vi.fn().mockResolvedValueOnce("mock result"),
  };
});

vi.mock("../../inquiries/update-inquiry-planetscale", () => {
  return {
    updateInquiryWithPlanetScale: vi.fn().mockResolvedValueOnce({
      id: "id",
      connectionType: "TELEGRAM",
      connectionUserId: "connectionUserId",
      createdAt: new Date(),
      query: "query",
      queryType: "queryType",
      status: "COMPLETED",
      updatedAt: new Date(),
      result: "result",
    } satisfies Inquiry),
  };
});

describe("completeInquiry tests", () => {
  it("should call completeInquiryWithOpenAI if the persona object is undefined", async () => {
    const result = await completeInquiry({
      id: "id",
      query: "query",
      queryType: "queryType",
    });

    expect(completeInquiryWithOpenAI).toHaveBeenCalledWith(
      {
        query: "query",
      },
      {
        openai,
      }
    );
    expect(result).toEqual("mock result");
  });

  it("should call completeInquiryWithDust if the persona object is defined", async () => {
    const result = await completeInquiry({
      id: "id",
      query: "query",
      queryType: "queryType",
      persona: {
        id: "id",
        config: "config",
        specificationHash: "specificationHash",
      },
    });

    expect(completeInquiryWithDust).toHaveBeenCalledWith(
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
        dustApiKey: env.DUST_API_KEY,
      }
    );
    expect(result).toEqual("mock result");
  });
});

describe("updateInquiry tests", () => {
  it("should call updateInquiryWithPlanetScale", async () => {
    await updateInquiry("id", {
      result: "result",
      status: "COMPLETED",
    });

    expect(updateInquiryWithPlanetScale).toHaveBeenCalledWith(
      "id",
      {
        result: "result",
        status: "COMPLETED",
      },
      {
        conn,
      }
    );
  });
});
