import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { WebhookVerifier } from "@/services/WebhookVerifier";

export async function POST(request: NextRequest) {
  const settings = getSettings();
  const secret = settings.WebhookSecret || "";

  const testPayload: any = {
    connectorId: 892353,
    sourceAccountNumber: "74629183",
    sourceAccountName: "Test Sender Ltd",
    sourceInstitution: "Test Bank",
    sourceReferenceNumber: "SRC" + Math.random().toString(36).substring(2, 12).toUpperCase(),
    beneficiaryAccountNumber: settings.MerchantAccountNumber.toString(),
    transactionReferenceNumber: "TXN" + Math.random().toString(36).substring(2, 12).toUpperCase(),
    transactionDescription: "Test webhook verification",
    transactionAmount: 500.00,
    transactionFee: 10.00,
    transactionDate: new Date().toISOString(),
    transactionStatusCode: "S",
    transactionCode: "DMP",
    responseCode: "S100",
    merchantReferenceNumber: "TEST-MERCHANT-REF",
    metaData: {
      timedAccountNumber: "11005533",
      referenceNumber: "TEST-REF-001",
      sourceDescription: "Test payment",
    },
  };

  const payloadJson = JSON.stringify(testPayload);
  const signature = WebhookVerifier.ComputeSignature(payloadJson, secret);

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const url = `${protocol}://${host}/api/webhook/pushpayment`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-OneKhusa-Webhook-Event": "pushpayment.success",
      "X-OneKhusa-Webhook-Signature": signature,
    },
    body: payloadJson,
  });

  const responseBody = await response.text();

  return NextResponse.json({
    status: "test webhook sent",
    payloadJson,
    signature,
    response: responseBody,
    note: "If this self-test shows VERIFIED, the algorithm is correct and your WebhookSecret matches.",
  });
}
