import { Connection } from "@planetscale/database";
import { env } from "../functions/inquiry-requested/env";
import { fetch } from "undici";
import { logger } from "../utils/logger";
import {
  UpdateInquiryHandler,
  UpdateInquiryHandlerArgs,
} from "./update-inquiry.interface";

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
  createdAt: string;
  updatedAt: string;
};

type Args = {
  status?: "REQUESTED" | "FAILED" | "COMPLETED";
  result?: string;
};

function createSetFragmentAndArgs(args: Args) {
  const fragmentArray: string[] = [];
  const argsArray: string[] = [];

  if (args.result) {
    fragmentArray.push(`result = ?`);
    argsArray.push(args.result);
  }
  if (args.status) {
    fragmentArray.push(`status = ?`);
    argsArray.push(args.status);
  }

  if (fragmentArray.length === 0) return undefined;

  const fragment = fragmentArray.join(", ");

  return { fragment: `SET ${fragment}`, args: argsArray };
}

type UpdateInquiryWithPlanetScaleHandler = (
  id: string,
  args: UpdateInquiryHandlerArgs,
  ctx: {
    conn: Connection;
  }
) => ReturnType<UpdateInquiryHandler>;

export const updateInquiryWithPlanetScale: UpdateInquiryWithPlanetScaleHandler =
  async (id, args, ctx) => {
    const setFragmentAndArgs = createSetFragmentAndArgs(args);

    if (setFragmentAndArgs !== undefined) {
      logger.info("SET query not empty. executing UPDATE");
      const { fragment, args: setArgs } = setFragmentAndArgs;

      await ctx.conn.execute(
        `UPDATE Inquiry ${fragment} WHERE id = ? LIMIT 1`,
        setArgs.concat([id])
      );
      logger.info("UPDATE query succeeded");
    }

    const result = await ctx.conn.execute(
      `SELECT * FROM Inquiry WHERE id = ?`,
      [id],
      { as: "object" }
    );

    logger.info("Got updated row");

    const inquiry = result.rows[0] as Inquiry;

    return {
      ...inquiry,
      createdAt: new Date(inquiry.createdAt),
      updatedAt: new Date(inquiry.updatedAt),
    };
  };
