"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ArrowLeft, BarChart2, Copy, Check } from "lucide-react";
import { toast } from "@heroui/react";
import {
  useAdminPromotion,
  useAdminPromotionRedemptions,
  useDeletePromotion,
  useUpdatePromotion,
} from "@/hooks/use-admin-promotions";
import { PromotionForm } from "../../_components/promotion-form";
import { ConfirmModal } from "../../../_components/confirm-modal";

interface PromotionEditViewProps {
  promotionId: string;
}

function formatPrice(p: number): string {
  return `£${(p / 100).toFixed(2)}`;
}

function formatDateTime(s: string): string {
  return new Date(s).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PromotionEditView({ promotionId }: PromotionEditViewProps) {
  const router = useRouter();

  const { data: promotion, isLoading } = useAdminPromotion(promotionId);
  const { data: redemptions } = useAdminPromotionRedemptions(promotionId);

  const updateMutation = useUpdatePromotion(promotionId);
  const deleteMutation = useDeletePromotion();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isLoading || !promotion) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} />
      </div>
    );
  }

  const summary = promotion.summary;
  const items = redemptions?.results || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/promotions"
            className="mb-2 inline-flex items-center gap-1"
            style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}
          >
            <ArrowLeft size={12} />
            Back to promotions
          </Link>
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
            {promotion.code}
          </h1>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
            {promotion.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-2 rounded-md px-4 py-2"
          style={{ border: "1px solid rgba(198,40,40,0.4)", color: "var(--error)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)" }}
        >
          <Trash2 size={14} />
          {promotion.times_used > 0 ? "Deactivate" : "Delete"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-5)" }}>
          <div className="mb-2 flex items-center justify-between">
            <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
              Link clicks
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", color: "var(--white)" }}>
            {summary.click_count}
          </p>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "var(--white-faint)", marginTop: "var(--space-1)" }}>
            People who opened the share link
          </p>
        </div>
        <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-5)" }}>
          <div className="mb-2 flex items-center justify-between">
            <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
              Redemptions
            </span>
            <BarChart2 size={14} style={{ color: "var(--gold-dark)" }} />
          </div>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", color: "var(--white)" }}>
            {summary.redemption_count}
            {promotion.max_uses_total ? (
              <span style={{ fontSize: "var(--text-base)", color: "var(--white-faint)" }}> / {promotion.max_uses_total}</span>
            ) : null}
          </p>
          {summary.conversion_rate !== null && (
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "var(--gold-dark)", marginTop: "var(--space-1)" }}>
              {summary.conversion_rate}% click → buy
            </p>
          )}
        </div>
        <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-5)" }}>
          <div className="mb-2 flex items-center justify-between">
            <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
              Total discounted
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", color: "var(--white)" }}>
            {formatPrice(summary.total_discount_pence)}
          </p>
        </div>
        <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-5)" }}>
          <div className="mb-2 flex items-center justify-between">
            <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
              Revenue from code
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", color: "var(--white)" }}>
            {formatPrice(summary.total_revenue_pence)}
          </p>
        </div>
        <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: `1px solid ${promotion.is_active ? "var(--success)" : "var(--bg-border)"}`, padding: "var(--space-5)" }}>
          <div className="mb-2 flex items-center justify-between">
            <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
              Status
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-2xl)", color: promotion.is_active ? "var(--success)" : "var(--error)" }}>
            {promotion.is_active ? "Active" : "Inactive"}
          </p>
        </div>
      </div>

      {/* Share link */}
      <ShareLinkCard code={promotion.code} copied={copied} setCopied={setCopied} />

      {/* Edit form */}
      <PromotionForm
        initial={promotion}
        submitting={updateMutation.isPending}
        submitLabel="Save changes"
        onCancel={() => router.push("/admin/promotions")}
        onSubmit={async (data) => {
          try {
            await updateMutation.mutateAsync(data);
            toast.success("Promotion updated");
          } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update";
            toast.danger(message);
          }
        }}
      />

      {/* Redemption history */}
      <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
        <h2 className="mb-4" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", color: "var(--white)" }}>
          Redemption history
        </h2>
        {items.length === 0 ? (
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
            No redemptions yet. Once a customer uses this code at checkout, the order will appear here with the discount applied.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md" style={{ border: "1px solid var(--bg-border)" }}>
            {items.map((r, i) => (
              <Link
                key={r.id}
                href={`/admin/orders/${r.order_number}`}
                className="flex items-center justify-between transition-colors duration-200 hover:bg-[rgba(187,148,41,0.05)]"
                style={{
                  padding: "var(--space-3) var(--space-4)",
                  borderBottom: i < items.length - 1 ? "1px solid var(--bg-border)" : "none",
                }}
              >
                <div>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--white)" }}>
                    {r.order_number}
                  </p>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                    {r.customer_email} · {formatDateTime(r.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--gold-dark)" }}>
                    -{formatPrice(r.discount_amount)}
                  </p>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                    on {formatPrice(r.order_total)} order
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        title={promotion.times_used > 0 ? "Deactivate promotion?" : "Delete promotion?"}
        message={
          promotion.times_used > 0
            ? "This code has been used. Deactivating it prevents new redemptions but keeps the history intact."
            : "This permanently removes the promotion. There is no undo."
        }
        confirmLabel={promotion.times_used > 0 ? "Deactivate" : "Delete"}
        destructive
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          try {
            await deleteMutation.mutateAsync(promotionId);
            toast.success(promotion.times_used > 0 ? "Deactivated" : "Deleted");
            router.push("/admin/promotions");
          } catch {
            toast.danger("Action failed");
          }
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Share link card
// ---------------------------------------------------------------------------
interface ShareLinkCardProps {
  code: string;
  copied: boolean;
  setCopied: (v: boolean) => void;
}

function ShareLinkCard({ code, copied, setCopied }: ShareLinkCardProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/?promo=${encodeURIComponent(code)}`;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.danger("Could not copy. Please copy the link manually.");
    }
  }

  return (
    <div
      className="rounded-lg"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--bg-border)",
        padding: "var(--space-6)",
      }}
    >
      <h2
        className="mb-1"
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "var(--text-xl)",
          color: "var(--white)",
        }}
      >
        Share link
      </h2>
      <p
        className="mb-4"
        style={{
          fontFamily: "var(--font-montserrat)",
          fontSize: "11px",
          color: "var(--white-faint)",
          lineHeight: "var(--leading-relaxed)",
        }}
      >
        Send this URL to influencers, partners, or anyone running the campaign.
        When someone opens it, the code is auto-applied to their cart and we
        record a click against this promotion. Conversions show up in the
        redemption history below as soon as the customer pays.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={shareUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full min-w-0 flex-1 outline-none"
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--bg-border)",
            color: "var(--white)",
            fontFamily: "monospace",
            fontSize: "var(--text-xs)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3) var(--space-4)",
          }}
        />
        <button
          type="button"
          onClick={copyToClipboard}
          className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 sm:w-auto sm:py-0"
          style={{
            background: copied ? "var(--success)" : "var(--gold)",
            color: "#FFFFFF",
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--weight-semibold)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-wide)",
            flexShrink: 0,
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>

      <p
        className="mt-3"
        style={{
          fontFamily: "var(--font-montserrat)",
          fontSize: "10px",
          color: "var(--white-faint)",
        }}
      >
        Customers can also type{" "}
        <code style={{ color: "var(--gold-dark)" }}>{code}</code> at checkout.
      </p>
    </div>
  );
}
