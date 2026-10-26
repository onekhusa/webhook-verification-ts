import { NextResponse } from "next/server";
import { OneKhusaService } from "@/services/OneKhusaService";
import { getSettings } from "@/lib/settings";

export async function POST() {
  const settings = getSettings();
  const oneKhusa = new OneKhusaService(settings);
  const { response, error } = await oneKhusa.GetAccessTokenAsync();
  if (error != null) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
  return NextResponse.json({ success: true, data: response });
}
