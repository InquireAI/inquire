import type { NextApiResponse } from "next";
import { z } from "zod";
import type {
  BadRequestRes,
  SuccessRes,
  InternalError,
  UnauthorizedRes,
  NotFoundRes,
  InvalidSubscription,
  QuotaReached,
} from "../../../api-responses";
import type { Inquiry, Persona } from "../../../../db/client";
import { prisma } from "../../../../db/client";
import { zodIssuesToBadRequestIssues } from "../../../utils";
import { env } from "../../../../../env/server.mjs";
import type { NextApiRequestWithLogger } from "../../../../logger/with-logger";
import { eventEmitter } from "../../../../eventEmitter/event-bridge-event-emitter";
import type { InquiryRequested } from "@inquire/schemas/dist/inquiry-requested";
import { gzipSync } from "zlib";

// define the body schema
const BodySchema = z.object({
  connectionType: z.enum(["WEB", "TELEGRAM"]),
  connectionUserId: z.string(),
  queryType: z.string(),
  query: z.string(),
});

type Res =
  | SuccessRes<Inquiry>
  | BadRequestRes
  | UnauthorizedRes
  | NotFoundRes
  | InternalError
  | InvalidSubscription
  | QuotaReached;

export async function createInquiry(
  req: NextApiRequestWithLogger,
  res: NextApiResponse<Res>
) {
  const { logger } = req;
  // validate the body
  const bodyParse = await BodySchema.spa(req.body);

  // return if the body is invalid
  if (!bodyParse.success) {
    logger.info(
      `Invalid request body: ${JSON.stringify(bodyParse.error.issues)}`,
      {
        type: "BAD_REQUEST",
        error: bodyParse.error,
      }
    );
    return res.status(400).json({
      code: "BAD_REQUEST",
      message: "Invalid request body",
      issues: zodIssuesToBadRequestIssues(bodyParse.error.issues),
    });
  }

  // parse the body
  const { data: bodyData } = bodyParse;

  // we check the connections table beacuse a user
  // might not have signed up via the website but we want
  // to still log the # of inquiries
  // in this case the `userId` is unique to the user _and_
  // the `connection`. It is not unique to the user alone.
  let connection = await prisma.connection.findUnique({
    where: {
      connectionType_connectionUserId: {
        connectionType: bodyData.connectionType,
        connectionUserId: bodyData.connectionUserId,
      },
    },
  });

  // check if user already has a connection
  // if not create a connection
  // else continue
  if (!connection) {
    logger.info(
      `Connection with connectionType: ${bodyData.connectionType} and connectionUserId: ${bodyData.connectionUserId} does not exist. Creating`
    );
    connection = await prisma.connection.create({
      data: {
        connectionType: bodyData.connectionType,
        connectionUserId: bodyData.connectionUserId,
      },
    });
    logger.info(
      `Connection with connectionType: ${connection.connectionType} and connectionUserId: ${connection.connectionUserId} created`,
      {
        type: "DATABASE_CALL",
        resource: {
          name: "Connection",
          connectionType: connection.connectionType,
          connectionUserId: connection.connectionUserId,
        },
      }
    );
  } else {
    logger.info(
      `Retrieved connection with connectionType: ${connection?.connectionType} and connectionUserId: ${connection?.connectionUserId}`,
      {
        type: "DATABASE_CALL",
        resource: {
          name: "Connection",
          connectionType: connection.connectionType,
          connectionUserId: connection.connectionUserId,
        },
      }
    );
  }

  // In order to validate a inquiry we
  // - check the users limits
  // - if user is over limit check if they are paying
  // - if they are paying allow the inquiry
  // - if they are not paying return a message saying they have exceeded the limit

  // Query users, loop over connections for one with the right connectionType and userId

  // users total number of inquires
  const inquiries = await prisma.inquiry.findMany({
    where: {
      connectionType: bodyData.connectionType,
      connectionUserId: connection.connectionUserId,
    },
  });

  if (connection.userId) {
    const user = await prisma.user.findUnique({
      where: {
        id: connection.userId,
      },
      include: {
        customer: {
          include: {
            subscriptions: true,
          },
        },
      },
    });

    // if a user is over their free limit check their subscription
    if (inquiries.length > env.USER_INQUIRY_LIMIT) {
      // NOTE: may be multiple products/prices/subscription in future, but currently we only have one, so just look for the first element
      const subscription = user?.customer?.subscriptions[0];
      if (!subscription) {
        logger.info(
          `Connection with type: ${bodyData.connectionType} and connectionUserId: ${bodyData.connectionUserId} has reached inquiry limit and no subscription found`
        );
        return res.status(400).json({
          code: "INVALID_SUBSCRIPTION",
          message: "Limit has been reached and subscription not found",
        });
      }

      // if subscription is not one of these statuses it's invalid
      if (
        subscription.status !== "active" &&
        subscription.status !== "trialing"
      ) {
        return res.status(400).json({
          code: "INVALID_SUBSCRIPTION",
          message: "Subscription is not active or trialing",
        });
      }
    } else {
      if (inquiries.length > env.USER_INQUIRY_LIMIT) {
        logger.info(
          `Connection with type: ${bodyData.connectionType} and connectionUserId: ${bodyData.connectionUserId} has reached inquiry limit`
        );

        return res.status(400).json({
          code: "QUOTA_REACHED",
          message: `User Limit Error`,
        });
      }
    }
  }

  let persona: Persona | null = null;

  if (bodyData.queryType !== "chat") {
    // find the app id for the queryType
    // else return error
    persona = await prisma.persona.findUnique({
      where: {
        name: bodyData.queryType,
      },
    });

    if (!persona) {
      logger.error(`No persona found with name: ${bodyData.queryType}`, {
        type: "DATABASE_CALL",
        resource: {
          name: "Persona",
        },
      });

      return res.status(400).json({
        code: "NOT_FOUND",
        message: `Persona not found`,
      });
    }
  }

  const newInquiry = await prisma.inquiry.create({
    data: {
      connectionType: bodyData.connectionType,
      connectionUserId: bodyData.connectionUserId,
      queryType: bodyData.queryType,
      query: bodyData.query,
      status: "REQUESTED",
    },
  });

  await eventEmitter.emit([
    {
      eventType: "InquiryRequested",
      payload: {
        id: newInquiry.id,
        connectionType: newInquiry.connectionType,
        connectionUserId: newInquiry.connectionUserId,
        query: newInquiry.query,
        queryType: newInquiry.queryType,
        status: "REQUESTED",
        persona: persona
          ? {
              id: persona.id,
              name: persona.name,
              prompt: gzipSync(persona.prompt).toString("base64"),
              config: persona.config,
              description: persona.description,
              specificationHash: persona.specificationHash,
            }
          : undefined,
      } satisfies InquiryRequested,
      source: "com.inquire.web",
    },
  ]);

  return res.status(200).json({ data: newInquiry });
}
