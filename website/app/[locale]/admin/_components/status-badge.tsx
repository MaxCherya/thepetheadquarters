import type { AdminOrderStatus } from "@/types/admin";

const STATUS_COLORS: Record<AdminOrderStatus, { bg: string; color: string; label: string }> = {
  pending: { bg: "rgba(230,81,0,0.1)", color: "var(--warning)", label: "Pending" },
  paid: { bg: "rgba(187,148,41,0.12)", color: "var(--gold-dark)", label: "Paid" },
  processing: { bg: "rgba(187,148,41,0.12)", color: "var(--gold-dark)", label: "Processing" },
  shipped: { bg: "rgba(21,101,192,0.1)", color: "var(--info)", label: "Shipped" },
  delivered: { bg: "rgba(46,125,50,0.1)", color: "var(--success)", label: "Delivered" },
  cancelled: { bg: "rgba(198,40,40,0.08)", color: "var(--error)", label: "Cancelled" },
};

interface StatusBadgeProps {
  status: AdminOrderStatus | string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status as AdminOrderStatus] || STATUS_COLORS.pending;
  const padding = size === "sm" ? "var(--space-1) var(--space-2)" : "var(--space-1) var(--space-3)";
  const fontSize = size === "sm" ? "10px" : "var(--text-xs)";

  return (
    <span
      className="inline-block rounded-full"
      style={{
        background: colors.bg,
        color: colors.color,
        fontFamily: "var(--font-montserrat)",
        fontSize,
        fontWeight: "var(--weight-semibold)",
        textTransform: "uppercase",
        letterSpacing: "var(--tracking-wide)",
        padding,
      }}
    >
      {colors.label}
    </span>
  );
}
