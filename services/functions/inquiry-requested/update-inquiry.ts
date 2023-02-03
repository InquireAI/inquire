import { connect } from "@planetscale/database";
import { env } from "./env";
import fetch from "node-fetch";

console.log(env);

const conn = connect({
  fetch,
  url: env.DATABASE_URL,
});

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

function createSetFragment(args: Args) {
  const fragmentArray: string[] = ["SET"];

  if (args.result) fragmentArray.push(`result = ${args.result}`);
  if (args.status) fragmentArray.push(`status = ${args.status}`);

  if (fragmentArray.length === 1) return undefined;

  const fragment = fragmentArray.join(", ");

  return fragment;
}

export async function updateInquiry(id: string, args: Args) {
  const setFragment = createSetFragment(args);

  if (!setFragment)
    await conn.execute(`UPDATE Inquiry ${setFragment} WHERE id = ? LIMIT 1;`, [
      id,
    ]);

  const result = await conn.execute(
    `SELECT * FROM Inquiry WHERE id = ?`,
    [id],
    { as: "object" }
  );

  console.log(result);

  return result.rows[0] as Inquiry;
}
