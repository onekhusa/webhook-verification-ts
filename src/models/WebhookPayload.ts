export interface WebhookMetaData {
  timedAccountNumber: string;
  referenceNumber: string;
  sourceDescription: string;
  [key: string]: any;
}

export interface WebhookPayload {
  connectorId: number;
  sourceAccountNumber: string;
  sourceAccountName: string;
  sourceInstitution: string;
  sourceReferenceNumber: string;
  merchantReferenceNumber: string;
  beneficiaryAccountNumber: string;
  transactionReferenceNumber: string;
  transactionDescription: string;
  transactionAmount: number;
  transactionFee: number;
  transactionDate: string;
  transactionStatusCode: string;
  transactionCode: string;
  responseCode: string;
  metaData?: any;
  MetaDataRaw?: any;
  MetaData?: WebhookMetaData | null;
  MetaDataRawJson?: string | null;
  ExtensionData?: Record<string, any> | null;
}

export class WebhookPayloadClass implements WebhookPayload {
  connectorId: number = 0;
  sourceAccountNumber: string = "";
  sourceAccountName: string = "";
  sourceInstitution: string = "";
  sourceReferenceNumber: string = "";
  merchantReferenceNumber: string = "";
  beneficiaryAccountNumber: string = "";
  transactionReferenceNumber: string = "";
  transactionDescription: string = "";
  transactionAmount: number = 0;
  transactionFee: number = 0;
  transactionDate: string = "";
  transactionStatusCode: string = "";
  transactionCode: string = "";
  responseCode: string = "";
  metaData?: any;
  MetaDataRaw?: any;
  MetaData?: WebhookMetaData | null = null;
  MetaDataRawJson?: string | null = null;
  ExtensionData?: Record<string, any> | null = null;

  Normalize() {
    let raw: any = this.MetaDataRaw;
    if (!raw || typeof raw !== "object" || raw.valueKind === "Null" || Array.isArray(raw)) {
      if (this.ExtensionData != null) {
        if (this.ExtensionData["metadata"] && typeof this.ExtensionData["metadata"] === "object") {
          raw = this.ExtensionData["metadata"];
        } else if (this.ExtensionData["meta_data"] && typeof this.ExtensionData["meta_data"] === "object") {
          raw = this.ExtensionData["meta_data"];
        }
      }
    }

    if (raw && typeof raw === "object") {
      this.MetaDataRawJson = JSON.stringify(raw);
      try {
        this.MetaData = raw as WebhookMetaData;
      } catch {
        this.MetaData = raw as WebhookMetaData;
      }
    }
  }
}
