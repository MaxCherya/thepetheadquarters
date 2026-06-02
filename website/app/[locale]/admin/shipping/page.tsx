"use client";

/**
 * Live editor for the storefront's shipping pricing.
 *
 * Two knobs — the free-shipping threshold and the flat-rate fee — that
 * customers see at checkout. Backed by a singleton DB row, so changes
 * land immediately without a redeploy.
 *
 * Replaces the old `SHIPPING_*_PENCE` env vars (still honoured as
 * fallbacks server-side if the DB row is missing).
 */

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import { CurrencyInput } from "../_components/currency-input";

interface ShippingSettings {
  free_threshold_pence: number;
  flat_rate_pence: number;
}

const shippingKey = ["admin", "shipping"] as const;

export default function AdminShippingPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: shippingKey,
    queryFn: async () => {
      const res = await apiClient.get<{ status: string; data: ShippingSettings }>(
        endpoints.admin.shipping.detail,
      );
      return res.data;
    },
  });

  const [threshold, setThreshold] = useState<number>(0);
  const [flatRate, setFlatRate] = useState<number>(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (data && !hydrated) {
      setThreshold(data.free_threshold_pence);
      setFlatRate(data.flat_rate_pence);
      setHydrated(true);
    }
  }, [data, hydrated]);

  const saveMutation = useMutation({
    mutationFn: async () =>
      apiClient.patch<{ status: string; data: ShippingSettings }>(
        endpoints.admin.shipping.detail,
        {
          free_threshold_pence: threshold,
          flat_rate_pence: flatRate,
        },
      ),
    onSuccess: () => {
      toast.success("Shipping prices updated");
      qc.invalidateQueries({ queryKey: shippingKey });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Save failed";
      toast.danger(msg);
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="h-6 w-6 animate-spin rounded-full"
          style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }}
        />
      </div>
    );
  }

  const dirty =
    threshold !== data.free_threshold_pence || flatRate !== data.flat_rate_pence;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "var(--text-3xl)",
            fontWeight: "var(--weight-regular)",
            color: "var(--white)",
          }}
        >
          Shipping
        </h1>
        <p
          className="mt-1"
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-sm)",
            color: "var(--white-faint)",
            lineHeight: 1.5,
          }}
        >
          Adjust the storefront&apos;s flat-rate delivery fee and free-shipping
          threshold. Changes apply to every checkout the moment you hit Save —
          no redeploy needed.
        </p>
      </div>

      <div
        className="flex flex-col gap-5 rounded-lg"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--bg-border)",
          padding: "var(--space-6)",
        }}
      >
        <Field
          label="Free-shipping threshold"
          hint="Subtotal at or above which delivery is free for the customer."
        >
          <CurrencyInput
            value={threshold}
            onChange={(p) => setThreshold(p ?? 0)}
            width="220px"
          />
        </Field>

        <Field
          label="Flat-rate fee"
          hint="What we charge below the threshold."
        >
          <CurrencyInput
            value={flatRate}
            onChange={(p) => setFlatRate(p ?? 0)}
            width="220px"
          />
        </Field>

        <div
          className="rounded-md p-3"
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--bg-border)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: 10,
              color: "var(--white-faint)",
              letterSpacing: "var(--tracking-wide)",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Preview
          </p>
          <p
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              color: "var(--white-dim)",
            }}
          >
            Customers spending £{(threshold / 100).toFixed(2)} or more get free
            delivery. Anything less is charged £{(flatRate / 100).toFixed(2)}.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!dirty || saveMutation.isPending}
            className="flex items-center gap-2 rounded-md px-5 py-2.5 disabled:opacity-40"
            style={{
              background: "var(--gold)",
              color: "#FFFFFF",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
            }}
          >
            <Save size={14} />
            {saveMutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        style={{
          fontFamily: "var(--font-montserrat)",
          fontSize: 11,
          color: "var(--white-faint)",
          letterSpacing: "var(--tracking-wide)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: 11,
            color: "var(--white-faint)",
            lineHeight: 1.5,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
