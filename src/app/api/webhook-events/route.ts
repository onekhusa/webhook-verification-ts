import { NextResponse } from "next/server";
import { getWebhookEvents } from "@/lib/webhookStore";

export async function GET() {
  const events = getWebhookEvents();
  events.sort((a, b) => {
    return new Date(b.ReceivedAt).getTime() - new Date(a.ReceivedAt).getTime();
  });
  return NextResponse.json(events);
}
