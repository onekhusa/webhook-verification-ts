import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { WebhookVerifier } from "@/services/WebhookVerifier";

export async function GET() {
  const settings = getSettings();
  const secret = settings.WebhookSecret || "";

  const payload = "{\"test\":\"hello\"}";
  const sig = WebhookVerifier.ComputeSignature(payload, secret);

  return NextResponse.json({
    secretConfigured: secret.length > 0,
    payload,
    payloadByteCount: Buffer.from(payload).length,
    computedSignature: sig,
    signatureLength: sig.length,
    instructions: "Go to https://mkjwk.org/ or any HMAC-SHA512 tool and compute HMAC-SHA512 of the payload string using the secret. If the result matches computedSignature above, your secret is correct.",
  });
}
