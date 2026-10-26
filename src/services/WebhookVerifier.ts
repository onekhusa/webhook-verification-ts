import { OneKhusaSettings } from "@/models/OneKhusaSettings";
import crypto from "crypto";

export class WebhookVerificationResult {
  Verified: boolean = false;
  Reason: string = "";
  SignatureProvided: string = "";
  ComputedSignature: string = "";
  SignatureMatch: boolean = false;
  PayloadLength: number = 0;
  Timestamp: Date = new Date();
}

export class WebhookVerifier {
  private _settings: OneKhusaSettings;
  private _logger: any;

  constructor(settings: OneKhusaSettings, logger?: any) {
    this._settings = settings;
    this._logger = logger || console;
  }

  static ComputeSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac("sha512", secret);
    hmac.update(payload);
    return hmac.digest("hex").toLowerCase();
  }

  private static ComputeDirectHmacSha512(secret: string, payloadBytes: Buffer): string {
    const hmac = crypto.createHmac("sha512", secret);
    hmac.update(payloadBytes);
    return hmac.digest("hex").toLowerCase();
  }

  VerifySignature(payloadBody: string, rawBodyBytes: Buffer, signatureHeader: string | null | undefined): WebhookVerificationResult {
    const result = new WebhookVerificationResult();
    result.SignatureProvided = signatureHeader ?? "";
    result.PayloadLength = payloadBody.length;
    result.Timestamp = new Date();

    if (!signatureHeader || signatureHeader == "") {
      result.Verified = false;
      result.Reason = "Signature header (X-OneKhusa-Webhook-Signature) is missing";
      this._logger.warn("Webhook signature header is missing");
      return result;
    }

    if (!this._settings.WebhookSecret || this._settings.WebhookSecret == "") {
      result.Verified = true;
      result.Reason = "WebhookSecret not configured - verification skipped";
      result.ComputedSignature = "N/A";
      this._logger.warn("Webhook secret is not configured - skipping verification");
      return result;
    }

    const secret = this._settings.WebhookSecret;

    const sigFromDocs = WebhookVerifier.ComputeSignature(payloadBody, secret);

    const rawString = rawBodyBytes.toString("utf8");
    const sigFromRawBytes = WebhookVerifier.ComputeSignature(rawString, secret);

    const sigFromRawDirect = WebhookVerifier.ComputeDirectHmacSha512(secret, rawBodyBytes);

    this._logger.log("info", `BODY: ${payloadBody.length} chars, ${Buffer.from(payloadBody).length} bytes, rawBytes=${rawBodyBytes.length} bytes`);
    this._logger.log("info", `Received sig : ${signatureHeader}`);
    this._logger.log("info", `Computed docs : ${sigFromDocs}`);
    this._logger.log("info", `Computed rawS : ${sigFromRawBytes}`);
    this._logger.log("info", `Computed rawB : ${sigFromRawDirect}`);

    if (sigFromDocs != sigFromRawBytes) {
      this._logger.warn("MISMATCH: docs-computed vs raw-bytes-computed differ - body bytes may have been modified in transit");
    }

    const headerLower = signatureHeader.toLowerCase();
    const match1 = this.timingSafeEqual(sigFromDocs, headerLower);
    const match2 = this.timingSafeEqual(sigFromRawBytes, headerLower);
    const match3 = this.timingSafeEqual(sigFromRawDirect, headerLower);

    if (match1 || match2 || match3) {
      result.Verified = true;
      result.SignatureMatch = true;
      result.ComputedSignature = sigFromDocs;
      result.Reason = "HMAC-SHA512 signature matches";
      this._logger.log("info", "Webhook VERIFIED");
    } else {
      result.Verified = false;
      result.SignatureMatch = false;
      result.ComputedSignature = sigFromDocs;
      result.Reason = "HMAC-SHA512 signature does not match. Verify WebhookSecret in appsettings.json matches the one in the OneKhusa dashboard.";
      this._logger.warn("Webhook REJECTED - HMAC-SHA512 did not match. Check that WebhookSecret matches the OneKhusa dashboard.");
    }

    return result;
  }

  private timingSafeEqual(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return a === b;
    }
  }
}
