import axios, { AxiosResponse } from "axios";

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

type Inquiry = {
  id: string;
  connectionType: ConnectionType;
  connectionUserId: string;
  queryType: string;
  query: string;
  status: InquiryStatus;
  result: string | null;
  createdAt: Date;
};

type Args = {
  status?: "REQUESTED" | "FAILED" | "COMPLETED";
  result?: string;
};

export async function updateInquiry(id: string, args: Args) {
  const res = await axios.patch<Inquiry, AxiosResponse<Inquiry>, Args>(
    `http://127.0.0.1/api/v1/inquiries/${id}`,
    {
      result: args.result,
      status: args.status,
    }
  );

  return res.data;
}
