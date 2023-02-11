import { CompleteInquiryHandler } from "../../inquiries/complete-inquiry.interface";
import { UpdateInquiryHandler } from "../../inquiries/update-inquiry.interface";

export type Args = {
  id: string;
  queryType: string;
  query: string;
  persona?: {
    id: string;
    config: string;
    specificationHash: string;
  };
};

export async function processInquiry(
  args: Args,
  ctx: {
    completeInquiry: CompleteInquiryHandler;
    updateInquiry: UpdateInquiryHandler;
  }
) {
  try {
    const result = await ctx.completeInquiry(args);

    await ctx.updateInquiry(args.id, {
      status: "COMPLETED",
      result,
    });
  } catch (error) {
    await ctx.updateInquiry(args.id, {
      status: "FAILED",
    });

    throw error;
  }
}
