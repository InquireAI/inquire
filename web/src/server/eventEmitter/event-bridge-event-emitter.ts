import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { env } from "../../env/server.mjs";
import type { EventEmitter, EventArgs, EventResult } from "./event-emitter";
import { EmitError } from "./event-emitter";

type EventBridgeEventEmitterArgs = {
  eventBusName: string;
};

export class EventBridgeEventEmitter implements EventEmitter {
  constructor(
    private client: EventBridgeClient,
    private args: EventBridgeEventEmitterArgs
  ) {}

  async emit(events: EventArgs[]): Promise<EventResult[]> {
    const results = await this.client.send(
      new PutEventsCommand({
        Entries: events.map((e) => ({
          Detail: JSON.stringify(e.payload),
          DetailType: e.eventType,
          EventBusName: this.args.eventBusName,
          Source: e.source,
        })),
      })
    );

    if (!results.Entries) throw new EmitError(`Failed to emit events`);

    return results.Entries.map<EventResult>((entry) => {
      if (entry.EventId) {
        return {
          success: true,
        };
      } else {
        return {
          success: false,
          code: entry.ErrorCode as string,
          message: entry.ErrorMessage as string,
        };
      }
    });
  }
}

export const eventEmitter = new EventBridgeEventEmitter(
  new EventBridgeClient({
    region: env.INQUIRE_AWS_REGION,
  }),
  {
    eventBusName: env.INQUIRE_EVENT_BUS_NAME,
  }
);
