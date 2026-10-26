import { OneKhusaSettings } from "@/models/OneKhusaSettings";

export function getSettings(): OneKhusaSettings {
  return {
    BaseUrl: process.env.ONEKHUSA_BASE_URL || "",
    ApiKey: process.env.ONEKHUSA_API_KEY || "",
    ApiSecret: process.env.ONEKHUSA_API_SECRET || "",
    OrganisationId: process.env.ONEKHUSA_ORGANISATION_ID || "",
    MerchantAccountNumber: Number.parseInt(process.env.ONEKHUSA_MERCHANT_ACCOUNT_NUMBER || "", 10),
    WebhookSecret: process.env.ONEKHUSA_WEBHOOK_SECRET || "",
    CapturedBy: process.env.ONEKHUSA_CAPTURED_BY || "",
  };
}
