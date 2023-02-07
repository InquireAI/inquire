export type EventArgs = {
  source: string;
  eventType: string;
  payload: Record<string, unknown>;
};

export type EventResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
      code: string;
    };

export interface EventEmitter {
  emit(events: EventArgs[]): Promise<EventResult[]>;
}

export class EmitError extends Error {}
