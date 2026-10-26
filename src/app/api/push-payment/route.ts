import { NextRequest, NextResponse } from "next/server";
import { OneKhusaService } from "@/services/OneKhusaService";
import { getSettings } from "@/lib/settings";
import { PushPaymentRequest } from "@/models/PushPaymentRequest";

export async function POST(request: NextRequest) {
  const settings = getSettings();
  const body = (await request.json()) as PushPaymentRequest;

  if (!Number.isSafeInteger(body.connectorId) || body.connectorId <= 0) {
    return NextResponse.json({ success: false, error: "ConnectorId must be greater than zero." }, { status: 400 });
  }
  if (!body.payerAccountNumber || body.payerAccountNumber.trim() == "") {
    return NextResponse.json({ success: false, error: "PayerAccountNumber is required." }, { status: 400 });
  }
  if (!Number.isFinite(body.transactionAmount) || body.transactionAmount <= 0) {
    return NextResponse.json({ success: false, error: "TransactionAmount must be greater than zero." }, { status: 400 });
  }
  if (!body.transactionDescription || body.transactionDescription.trim() == "") {
    return NextResponse.json({ success: false, error: "TransactionDescription is required." }, { status: 400 });
  }
  if (!settings.BaseUrl || !Number.isSafeInteger(settings.MerchantAccountNumber) || settings.MerchantAccountNumber <= 0 || !settings.CapturedBy.trim()) {
    return NextResponse.json({ success: false, error: "ONEKHUSA_BASE_URL, ONEKHUSA_CAPTURED_BY, and a valid ONEKHUSA_MERCHANT_ACCOUNT_NUMBER must be configured." }, { status: 500 });
  }
  body.merchantAccountNumber = settings.MerchantAccountNumber;
  body.capturedBy = settings.CapturedBy;
  if (!body.sourceReferenceNumber || body.sourceReferenceNumber.trim() == "") {
    body.sourceReferenceNumber = `PUSH-${crypto.randomUUID().replace(/-/g, "")}`;
  }

  const oneKhusa = new OneKhusaService(settings);
  const { response, error } = await oneKhusa.PushPaymentAsync(body);
  if (error != null) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
  return NextResponse.json({ success: true, data: response });
}
