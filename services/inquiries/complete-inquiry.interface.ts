export type CompleteInquiryHandlerArgs = {
  id: string;
  queryType: string;
  query: string;
  persona?: {
    id: string;
    config: string;
    specificationHash: string;
  };
};

export type CompleteInquiryHandler = (
  args: CompleteInquiryHandlerArgs
) => Promise<string>;
