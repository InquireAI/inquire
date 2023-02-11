const ConnectionType = {
  WEB: "WEB",
  TELEGRAM: "TELEGRAM",
} as const;

type ConnectionType = (typeof ConnectionType)[keyof typeof ConnectionType];

const InquiryStatus = {
  REQUESTED: "REQUESTED",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

type InquiryStatus = (typeof InquiryStatus)[keyof typeof InquiryStatus];

export type Inquiry = {
  id: string;
  connectionType: ConnectionType;
  connectionUserId: string;
  queryType: string;
  query: string;
  status: InquiryStatus;
  result?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateInquiryHandlerArgs = {
  status?: "REQUESTED" | "FAILED" | "COMPLETED";
  result?: string;
};

export type UpdateInquiryHandler = (
  id: string,
  args: UpdateInquiryHandlerArgs
) => Promise<Inquiry>;
