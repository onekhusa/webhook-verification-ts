import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { WebhookVerifier } from "@/services/WebhookVerifier";
import { WebhookPayloadClass } from "@/models/WebhookPayload";
import { addWebhookEvent } from "@/lib/webhookStore";

async function HandleWebhookAsync(request: NextRequest) {
  const settings = getSettings();
  const verifier = new WebhookVerifier(settings);

  const arrayBuffer = await request.arrayBuffer();
  const bodyBytes = Buffer.from(arrayBuffer);
  const body = bodyBytes.toString("utf8");

  const webhookEvent = request.headers.get("x-onekhusa-webhook-event") || request.headers.get("X-OneKhusa-Webhook-Event") || "";
  const signature = request.headers.get("x-onekhusa-webhook-signature") || request.headers.get("X-OneKhusa-Webhook-Signature") || "";

  const allHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    allHeaders[key] = value;
  });

  console.log("WEBHOOK RECEIVED | Headers: " + JSON.stringify(allHeaders));
  console.log(`RAW WEBHOOK BODY (${bodyBytes.length} bytes): ${body}`);

  const verification = verifier.VerifySignature(body, bodyBytes, signature);

  let payload: WebhookPayloadClass | null = null;
  try {
    const parsed = JSON.parse(body);
    payload = Object.assign(new WebhookPayloadClass(), parsed);
    payload.Normalize();
  } catch (e) {
    console.error("Failed to parse webhook payload", e);
  }

  const log = {
    ReceivedAt: new Date().toISOString(),
    Event: webhookEvent || "unknown",
    Signature: signature || "",
    Payload: body,
    ParsedPayload: payload,
    Headers: allHeaders,
    Verified: verification.Verified,
    VerificationReason: verification.Reason,
    SignatureProvided: verification.SignatureProvided,
    ComputedSignature: verification.ComputedSignature,
    SignatureMatch: verification.SignatureMatch,
  };
  addWebhookEvent(log);

  console.log(`Webhook ${verification.Verified ? "VERIFIED" : "REJECTED"}: ${webhookEvent} | TAN: ${payload?.MetaData?.timedAccountNumber} | Amount: ${payload?.transactionAmount}`);

  return NextResponse.json({
    status: "received",
    verification: {
      verified: verification.Verified,
      reason: verification.Reason,
    },
  });
}

export async function POST(request: NextRequest) {
  return HandleWebhookAsync(request);
}
