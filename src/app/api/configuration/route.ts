import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

export async function GET() {
  const settings = getSettings();
  return NextResponse.json({
    apiBaseUrl: settings.BaseUrl,
    merchantAccountNumber: settings.MerchantAccountNumber,
  });
}
