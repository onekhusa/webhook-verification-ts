export interface PushPaymentRequest {
  merchantAccountNumber: number;
  connectorId: number;
  payerAccountNumber: string;
  sourceReferenceNumber: string;
  transactionDescription: string;
  transactionAmount: number;
  capturedBy: string;
}
