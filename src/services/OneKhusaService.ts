import { GetAccessTokenRequest } from "@/models/GetAccessTokenRequest";
import { GetAccessTokenResponse } from "@/models/GetAccessTokenResponse";
import { OneKhusaSettings } from "@/models/OneKhusaSettings";
import { PushPaymentRequest } from "@/models/PushPaymentRequest";

export class OneKhusaService {
  private _httpClient: typeof fetch;
  private _settings: OneKhusaSettings;
  private _cachedAccessToken: string | null = null;
  private _tokenExpiry: Date = new Date(0);

  constructor(settings: OneKhusaSettings) {
    this._httpClient = fetch;
    this._settings = settings;
  }

  async GetAccessTokenAsync(): Promise<{ response: GetAccessTokenResponse | null, error: string | null }> {
    const request: GetAccessTokenRequest = {
      apiKey: this._settings.ApiKey,
      apiSecret: this._settings.ApiSecret,
      organisationId: this._settings.OrganisationId,
      merchantAccountNumber: this._settings.MerchantAccountNumber,
    };

    try {
      const response = await this._httpClient(`${this._settings.BaseUrl}/account/getAccessToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const body = await response.text();

      if (!response.ok) {
        console.error(`GetAccessToken failed with status ${response.status}: ${body}`);
        return { response: null, error: `HTTP ${response.status}: ${body}` };
      }

      const result = JSON.parse(body) as GetAccessTokenResponse;
      if (!result) {
        return { response: null, error: `Failed to deserialize response: ${body}` };
      }

      this._cachedAccessToken = result.accessToken;
      this._tokenExpiry = new Date(result.expiresOn);

      console.log(`Access token obtained, expires on ${result.expiresOn}`);
      return { response: result, error: null };
    } catch (ex: any) {
      console.error("GetAccessToken request failed", ex);
      return { response: null, error: ex.message };
    }
  }

  async GetValidAccessTokenAsync(): Promise<string | null> {
    if (!this._cachedAccessToken || new Date() >= new Date(this._tokenExpiry.getTime() - 60 * 1000)) {
      const { response, error } = await this.GetAccessTokenAsync();
      if (error != null || response == null) return null;
      return response.accessToken;
    }
    return this._cachedAccessToken;
  }

  async PushPaymentAsync(request: PushPaymentRequest): Promise<{ response: any | null, error: string | null }> {
    const token = await this.GetValidAccessTokenAsync();
    if (token == null) {
      return { response: null, error: "Failed to obtain access token. Check your OneKhusa credentials in appsettings.json." };
    }

    const idempotencyKey = this.generateGuid();

    try {
      const httpRequest = new Request(`${this._settings.BaseUrl}/collections/push/direct/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept-Language": "en",
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(request),
      });

      const response = await this._httpClient(httpRequest);
      const responseBody = await response.text();

      if (!response.ok) {
        console.error(`PushPayment failed with status ${response.status}: ${responseBody}`);
        return { response: null, error: `HTTP ${response.status}: ${responseBody}` };
      }

      const document = JSON.parse(responseBody);
      return { response: document, error: null };
    } catch (ex: any) {
      console.error("PushPayment request failed", ex);
      return { response: null, error: ex.message };
    }
  }

  private generateGuid(): string {
    return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, function (c) {
      const r = Math.random() * 16 | 0;
      return r.toString(16);
    });
  }
}
