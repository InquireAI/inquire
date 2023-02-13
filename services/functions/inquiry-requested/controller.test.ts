import { Inquiry } from "../../inquiries/update-inquiry.interface";
import { describe, expect, it, vi } from "vitest";
import { processInquiry, Args } from "./controller";

describe("processInquiry tests", () => {
  const args = {
    id: "id",
    queryType: "queryType",
    query: "query",
    persona: {
      id: "id",
      config: "config",
      specificationHash: "specificationHash",
    },
  } satisfies Args;

  const inquiry = {
    id: "id",
    connectionType: "TELEGRAM",
    connectionUserId: "connectionUserId",
    createdAt: new Date(),
    updatedAt: new Date(),
    query: "query",
    queryType: "queryType",
    status: "COMPLETED",
    result: "result",
  } satisfies Inquiry;

  it("should call updateInquiry with COMPLETED and result if completeInquiry succeeds", async () => {
    const completeInquiryResult = "result";

    const completeInquiry = vi
      .fn()
      .mockResolvedValueOnce(completeInquiryResult);

    const updateInquiry = vi.fn().mockResolvedValueOnce(inquiry);

    await processInquiry(args, {
      completeInquiry,
      updateInquiry,
    });

    expect(completeInquiry).toHaveBeenCalledWith(args);
    expect(updateInquiry).toHaveBeenCalledWith(args.id, {
      status: "COMPLETED",
      result: completeInquiryResult,
    });
  });

  it("should call updateInquiry with FAILED if completeInquiry fails", async () => {
    const completeInquiryError = new Error("This is a completed inquiry error");
    const completeInquiry = vi.fn().mockRejectedValueOnce(completeInquiryError);

    const updateInquiry = vi.fn().mockResolvedValueOnce(inquiry);

    try {
      await processInquiry(args, {
        completeInquiry,
        updateInquiry,
      });
    } catch (error) {
      expect(completeInquiry).toHaveBeenCalledWith(args);
      expect(updateInquiry).toHaveBeenCalledWith(args.id, {
        status: "FAILED",
      });
      expect(error).toEqual(completeInquiryError);
    }
  });
});
