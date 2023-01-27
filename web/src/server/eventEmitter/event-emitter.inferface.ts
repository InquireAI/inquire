type EventArgs = {
  source: string;
  eventType: string;
  payload: Record<string, unknown>;
};

export interface EventEmitter {
  emit(events: EventArgs): Promise<void>;
}
