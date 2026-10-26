export interface WebhookEventLog {
  ReceivedAt: string;
  Event: string;
  Signature: string;
  Payload: string;
  ParsedPayload: any;
  Headers: Record<string, string>;
  Verified: boolean;
  VerificationReason: string;
  SignatureProvided: string;
  ComputedSignature: string;
  SignatureMatch: boolean;
}

const webhookEvents: WebhookEventLog[] = [];

export function addWebhookEvent(log: WebhookEventLog) {
  webhookEvents.unshift(log);
}

export function getWebhookEvents(): WebhookEventLog[] {
  return webhookEvents;
}

export function clearWebhookEvents() {
  webhookEvents.length = 0;
}
