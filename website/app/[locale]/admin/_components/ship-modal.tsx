"use client";

import { useState } from "react";
import { CARRIER_LABELS, type CarrierCode } from "@/types/admin";
import type enAdmin from "@/i18n/dictionaries/en/admin.json";

interface ShipModalProps {
  open: boolean;
  dict: typeof enAdmin;
  loading?: boolean;
  onSubmit: (carrier: CarrierCode, trackingNumber: string, trackingUrl: string) => void;
  onCancel: () => void;
}

export function ShipModal({ open, dict, loading, onSubmit, onCancel }: ShipModalProps) {
  const [carrier, setCarrier] = useState<CarrierCode | "">("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  function handleSubmit() {
    setError("");
    if (!carrier) {
      setError(dict.orders.errors.carrier_required);
      return;
    }
    if (carrier === "other") {
      if (!trackingUrl.trim()) {
        setError(dict.orders.errors.url_required);
        return;
      }
    } else {
      if (!trackingNumber.trim()) {
        setError(dict.orders.errors.tracking_required);
        return;
      }
    }
    onSubmit(carrier, trackingNumber.trim(), trackingUrl.trim());
  }

  const labelStyle = {
    fontFamily: "var(--font-montserrat)",
    fontSize: "var(--text-xs)" as const,
    fontWeight: "var(--weight-medium)" as const,
    color: "var(--white-dim)",
    letterSpacing: "var(--tracking-wide)",
    textTransform: "uppercase" as const,
    display: "block" as const,
    marginBottom: "var(--space-2)",
  };

  const inputStyle = {
    background: "var(--bg-tertiary)",
    border: "1px solid var(--bg-border)",
    color: "var(--white)",
    fontFamily: "var(--font-montserrat)",
    fontSize: "var(--text-sm)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-3) var(--space-4)",
    width: "100%",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-lg"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--bg-border)",
          padding: "var(--space-6)",
          margin: "var(--space-4)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "var(--text-2xl)",
            fontWeight: "var(--weight-regular)",
            color: "var(--white)",
            marginBottom: "var(--space-5)",
          }}
        >
          {dict.orders.shipModal.title}
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label style={labelStyle}>{dict.orders.shipModal.carrier}</label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value as CarrierCode)}
              style={inputStyle}
            >
              <option value="">{dict.orders.shipModal.selectCarrier}</option>
              {(Object.keys(CARRIER_LABELS) as CarrierCode[]).map((code) => (
                <option key={code} value={code}>
                  {dict.orders.carriers[code]}
                </option>
              ))}
            </select>
          </div>

          {carrier && carrier !== "other" && (
            <div>
              <label style={labelStyle}>{dict.orders.shipModal.trackingNumber}</label>
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="outline-none"
                style={inputStyle}
                placeholder="ABC123..."
              />
            </div>
          )}

          {carrier === "other" && (
            <div>
              <label style={labelStyle}>{dict.orders.shipModal.trackingUrl}</label>
              <input
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                type="url"
                className="outline-none"
                style={inputStyle}
                placeholder="https://..."
              />
            </div>
          )}

          {error && (
            <p
              style={{
                fontFamily: "var(--font-montserrat)",
                fontSize: "var(--text-xs)",
                color: "var(--error)",
              }}
            >
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-md px-5 py-2.5 transition-colors duration-200 disabled:opacity-50"
            style={{
              border: "1px solid var(--bg-border)",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              color: "var(--white-dim)",
            }}
          >
            {dict.orders.shipModal.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-md px-5 py-2.5 transition-colors duration-200 disabled:opacity-50"
            style={{
              background: "var(--gold)",
              color: "#FFFFFF",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-semibold)",
            }}
          >
            {loading ? "..." : dict.orders.shipModal.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
