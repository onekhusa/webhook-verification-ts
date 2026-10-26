"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const apiBase = typeof window !== "undefined" ? window.location.origin : "";
  const [pushResult, setPushResult] = useState<string>("");
  const [pushResultType, setPushResultType] = useState<"success" | "error" | "">("");
  const [pushLoading, setPushLoading] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [merchantAccountNumber, setMerchantAccountNumber] = useState<number | null>(null);
  const [configurationError, setConfigurationError] = useState("");

  const [connectorId, setConnectorId] = useState("");
  const [payerAccountNumber, setPayerAccountNumber] = useState("");
  const [pushAmount, setPushAmount] = useState("");
  const [pushDescription, setPushDescription] = useState("");
  const [pushSourceReference, setPushSourceReference] = useState("");

  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [testWebhookLoading, setTestWebhookLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(apiBase + "/api/webhook/pushpayment");
    }
    loadConfiguration();
    loadWebhooks();
    const interval = setInterval(loadWebhooks, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadConfiguration() {
    try {
      const res = await fetch(apiBase + "/api/configuration");
      const data = await res.json();
      if (!res.ok || typeof data.apiBaseUrl !== "string" || typeof data.merchantAccountNumber !== "number") {
        throw new Error(data.error || "Unable to load configuration.");
      }
      setApiBaseUrl(data.apiBaseUrl);
      setMerchantAccountNumber(data.merchantAccountNumber);
      setConfigurationError("");
    } catch (error: unknown) {
      setConfigurationError(error instanceof Error ? error.message : "Unable to load configuration.");
    }
  }

  async function loadWebhooks() {
    try {
      const res = await fetch(apiBase + "/api/webhook-events");
      const data = await res.json();
      if (Array.isArray(data)) {
        setWebhooks(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function clearWebhooks() {
    setWebhooks([]);
  }

  function copyWebhookUrl() {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(webhookUrl);
    }
  }

  async function testWebhook() {
    setTestWebhookLoading(true);
    try {
      await fetch(apiBase + "/api/test-webhook", { method: "POST" });
      loadWebhooks();
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setTestWebhookLoading(false), 1000);
  }

  async function initiatePushPayment() {
    setPushLoading(true);
    setPushResult("");
    setPushResultType("");

    const body = {
      connectorId: parseInt(connectorId, 10),
      payerAccountNumber: payerAccountNumber,
      sourceReferenceNumber: pushSourceReference,
      transactionAmount: parseFloat(pushAmount),
      transactionDescription: pushDescription,
    };

    try {
      const res = await fetch(apiBase + "/api/push-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setPushResult(JSON.stringify(data.data ?? data, null, 2));
        setPushResultType("success");
      } else {
        setPushResult(typeof data.error === "string" ? data.error : JSON.stringify(data.error || data, null, 2));
        setPushResultType("error");
      }
    } catch (e: any) {
      setPushResult("Error: " + e.message + "\n\nMake sure the server is running and accessible.");
      setPushResultType("error");
    }
    setPushLoading(false);
  }

  return (
    <div>
      <div className="header">
        <h1>OneKhusa Payment Test</h1>
        <p>Sandbox - Push Payment with Webhook Verification</p>
      </div>

      <div className="container">
        <div className="grid-2">
          <div className="card">
            <h2><span className="dot green"></span> Push Payment</h2>
            <div className="form-group">
              <label>Connector ID</label>
              <input type="number" value={connectorId} onChange={(e) => setConnectorId(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Payer Account Number</label>
              <input type="text" value={payerAccountNumber} onChange={(e) => setPayerAccountNumber(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Transaction Amount</label>
              <input type="number" step="0.01" value={pushAmount} onChange={(e) => setPushAmount(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" value={pushDescription} onChange={(e) => setPushDescription(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Source Reference (auto-generated if empty)</label>
              <input type="text" value={pushSourceReference} onChange={(e) => setPushSourceReference(e.target.value)} placeholder="Leave empty to auto-generate" />
            </div>
            <button className="btn-primary" onClick={initiatePushPayment} disabled={pushLoading} id="btn-push">
              {pushLoading ? "Initiating..." : "Initiate Push Payment"}
            </button>
            {pushResult && (
              <div className={`result-box ${pushResultType}`}>{pushResult}</div>
            )}
          </div>

          <div className="card">
            <h2><span className="dot orange"></span> Webhook Events</h2>
            <div className="btn-group" style={{ marginBottom: "12px" }}>
              <button className="btn-secondary" onClick={loadWebhooks}>Refresh</button>
              <button className="btn-secondary" onClick={clearWebhooks}>Clear</button>
              <button className="btn-primary" onClick={testWebhook} disabled={testWebhookLoading} style={{ fontSize: "11px", padding: "6px 12px" }}>
                {testWebhookLoading ? "Sending..." : "Send Test Webhook"}
              </button>
            </div>
            <div className="webhook-list" id="webhook-list">
              {webhooks.length === 0 ? (
                <div style={{ color: "#8b949e", fontSize: "13px", textAlign: "center", padding: "20px" }}>No webhook events yet</div>
              ) : (
                webhooks.map((w: any, idx: number) => {
                  const parsed = w.ParsedPayload || w.parsedPayload;
                  const rawPayload = w.Payload || w.payload;
                  const amt = parsed ? parsed.transactionAmount : "N/A";
                  let tan = "N/A";
                  try {
                    if (parsed?.MetaData?.timedAccountNumber) tan = parsed.MetaData.timedAccountNumber;
                    else if (parsed?.MetaDataRawJson) tan = JSON.parse(parsed.MetaDataRawJson).timedAccountNumber;
                    else if (parsed?.metaData?.timedAccountNumber) tan = parsed.metaData.timedAccountNumber;
                  } catch {}
                  const evtStatus = ["payrequest.success", "pushpayment.success"].includes(w.Event || w.event) ? "success" : "pending";

                  let verifyBanner = null;
                  if (w.Verified || w.verified) {
                    verifyBanner = <div className="verify-banner verified"><span className="verify-icon">✓</span> Webhook Verified<span className="verify-detail">— {w.VerificationReason || w.verificationReason}</span></div>;
                  } else if (w.SignatureProvided || w.signatureProvided) {
                    verifyBanner = <div className="verify-banner rejected"><span className="verify-icon">✗</span> Verification Failed<span className="verify-detail">— {w.VerificationReason || w.verificationReason}</span></div>;
                  } else {
                    verifyBanner = <div className="verify-banner skipped"><span className="verify-icon">—</span> Verification Skipped<span className="verify-detail">— {w.VerificationReason || w.verificationReason}</span></div>;
                  }

                  const sigDetails = (w.SignatureProvided || w.signatureProvided) ? (
                    <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #21262d" }}>
                      <div className="sig-row"><span className="sig-label">Received:</span><span className="sig-value">{w.SignatureProvided || w.signatureProvided}</span></div>
                      <div className="sig-row"><span className="sig-label">Computed:</span><span className="sig-value">{w.ComputedSignature || w.computedSignature}</span></div>
                      <div className="sig-row"><span className="sig-label">Match:</span><span className="sig-value" style={{ color: (w.SignatureMatch || w.signatureMatch) ? "#3fb950" : "#f85149" }}>{(w.SignatureMatch || w.signatureMatch) ? "YES" : "NO"}</span></div>
                    </div>
                  ) : null;

                  const headers = w.Headers || w.headers;
                  const headersDetails = headers ? (
                    <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #21262d" }}>
                      <div style={{ fontSize: "11px", color: "#8b949e", marginBottom: "4px" }}>HEADERS:</div>
                      {Object.entries(headers).map(([k, v]: any, i: number) => (
                        <div className="sig-row" key={i}><span className="sig-label">{k}:</span><span className="sig-value">{v}</span></div>
                      ))}
                    </div>
                  ) : null;

                  let displayJson = rawPayload;
                  try {
                    displayJson = JSON.stringify(typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload, null, 2);
                  } catch {}

                  return (
                    <div className="webhook-item" key={idx}>
                      {verifyBanner}
                      <div className="meta">
                        <span className={`status-badge ${evtStatus}`}>{w.Event || w.event}</span>
                        <span>{new Date(w.ReceivedAt || w.receivedAt).toLocaleString()}</span>
                        <span>TAN: {tan}</span>
                        <span>Amount: {amt}</span>
                      </div>
                      <pre>{displayJson}</pre>
                      {headersDetails}
                      {sigDetails}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h2><span className="dot purple"></span> Configuration</h2>
          <div style={{ fontSize: "12px", color: "#8b949e", display: "grid", gap: "6px" }}>
            <div><strong style={{ color: "#c9d1d9" }}>API Base:</strong> {apiBaseUrl || "Not configured"}</div>
            <div><strong style={{ color: "#c9d1d9" }}>Merchant Account:</strong> {merchantAccountNumber ?? "Not configured"}</div>
            {configurationError && <div style={{ color: "#f85149" }}>{configurationError}</div>}
            <div><strong style={{ color: "#c9d1d9" }}>Webhook Callback URL:</strong>
              <span style={{ color: "#58a6ff", fontFamily: "monospace" }}>{webhookUrl}</span>
              <button className="copy-btn" onClick={copyWebhookUrl} style={{ marginLeft: "8px" }}>Copy</button>
            </div>
            <div><strong style={{ color: "#c9d1d9" }}>Note:</strong> Configure your callback URL in the OneKhusa dashboard to point to your devtunnel URL. Only Push Payment is implemented.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
