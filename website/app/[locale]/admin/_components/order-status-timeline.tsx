import { Check, Clock, Package, Truck, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import type { AdminOrder, AdminOrderStatus } from "@/types/admin";

interface OrderStatusTimelineProps {
  order: AdminOrder;
}

interface Step {
  key: AdminOrderStatus | "refunded";
  label: string;
  icon: typeof Check;
  timestamp: string | null;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderStatusTimeline({ order }: OrderStatusTimelineProps) {
  // Build the linear progression
  const isCancelled = order.status === "cancelled";
  const isRefunded = !!order.refunded_at;

  const baseSteps: Step[] = [
    { key: "pending", label: "Placed", icon: Clock, timestamp: order.created_at },
    { key: "paid", label: "Paid", icon: Check, timestamp: order.paid_at },
    { key: "processing", label: "Processing", icon: Package, timestamp: order.paid_at },
    { key: "shipped", label: "Shipped", icon: Truck, timestamp: order.shipped_at },
    { key: "delivered", label: "Delivered", icon: CheckCircle2, timestamp: order.delivered_at },
  ];

  // Determine which steps are completed based on status
  const statusOrder: AdminOrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered"];
  const currentIndex = statusOrder.indexOf(order.status as AdminOrderStatus);

  function getStepState(stepIndex: number, stepKey: string): "complete" | "current" | "pending" {
    if (isCancelled || isRefunded) {
      // Show timeline up to where we got, then mark as cancelled
      if (stepKey === "shipped" && order.shipped_at) return "complete";
      if (stepKey === "processing" && order.paid_at) return "complete";
      if (stepKey === "paid" && order.paid_at) return "complete";
      if (stepKey === "pending") return "complete";
      return "pending";
    }
    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  }

  return (
    <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
      <h2 className="mb-6" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)", color: "var(--white-faint)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" }}>
        Order Lifecycle
      </h2>

      {(isCancelled || isRefunded) && (
        <div
          className="mb-6 flex items-center gap-3 rounded-md"
          style={{
            background: isRefunded ? "rgba(198,40,40,0.08)" : "rgba(198,40,40,0.06)",
            border: "1px solid rgba(198,40,40,0.25)",
            padding: "var(--space-3) var(--space-4)",
          }}
        >
          {isRefunded ? (
            <RotateCcw size={18} style={{ color: "var(--error)" }} />
          ) : (
            <XCircle size={18} style={{ color: "var(--error)" }} />
          )}
          <div className="flex-1">
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--error)" }}>
              {isRefunded ? "Refunded" : "Cancelled"}
            </p>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
              {formatDateTime(isRefunded ? order.refunded_at : order.cancelled_at)}
              {isRefunded && order.refund_amount > 0 && ` · £${(order.refund_amount / 100).toFixed(2)}`}
            </p>
          </div>
        </div>
      )}

      {/* Desktop horizontal timeline */}
      <div className="hidden md:block">
        <div className="flex items-start justify-between">
          {baseSteps.map((step, i) => {
            const state = getStepState(i, step.key);
            const Icon = step.icon;
            const isLast = i === baseSteps.length - 1;

            const color =
              state === "complete"
                ? "var(--success)"
                : state === "current"
                  ? "var(--gold-dark)"
                  : "var(--white-faint)";

            const bgColor =
              state === "complete"
                ? "rgba(46,125,50,0.12)"
                : state === "current"
                  ? "rgba(187,148,41,0.15)"
                  : "var(--bg-tertiary)";

            return (
              <div key={step.key} className="flex flex-1 items-start" style={{ minWidth: 0 }}>
                <div className="flex flex-col items-center" style={{ minWidth: "70px" }}>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      background: bgColor,
                      border: `2px solid ${color}`,
                      opacity: isCancelled && state !== "complete" ? 0.4 : 1,
                    }}
                  >
                    <Icon size={16} style={{ color }} />
                  </div>
                  <p
                    className="mt-2 text-center"
                    style={{
                      fontFamily: "var(--font-montserrat)",
                      fontSize: "var(--text-xs)",
                      fontWeight: state === "current" ? "var(--weight-semibold)" : "var(--weight-regular)",
                      color: state === "pending" ? "var(--white-faint)" : "var(--white)",
                    }}
                  >
                    {step.label}
                  </p>
                  {step.timestamp && state !== "pending" && (
                    <p
                      className="mt-0.5 text-center"
                      style={{
                        fontFamily: "var(--font-montserrat)",
                        fontSize: "10px",
                        color: "var(--white-faint)",
                      }}
                    >
                      {formatDateTime(step.timestamp)}
                    </p>
                  )}
                </div>
                {!isLast && (
                  <div
                    className="mt-5 flex-1"
                    style={{
                      height: "2px",
                      background:
                        getStepState(i + 1, baseSteps[i + 1].key) !== "pending"
                          ? "var(--success)"
                          : "var(--bg-border)",
                      opacity: isCancelled ? 0.4 : 1,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile vertical timeline */}
      <div className="md:hidden">
        <div className="flex flex-col gap-4">
          {baseSteps.map((step, i) => {
            const state = getStepState(i, step.key);
            const Icon = step.icon;
            const color =
              state === "complete"
                ? "var(--success)"
                : state === "current"
                  ? "var(--gold-dark)"
                  : "var(--white-faint)";
            const bgColor =
              state === "complete"
                ? "rgba(46,125,50,0.12)"
                : state === "current"
                  ? "rgba(187,148,41,0.15)"
                  : "var(--bg-tertiary)";

            return (
              <div key={step.key} className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: bgColor,
                    border: `2px solid ${color}`,
                    opacity: isCancelled && state !== "complete" ? 0.4 : 1,
                  }}
                >
                  <Icon size={14} style={{ color }} />
                </div>
                <div className="flex-1">
                  <p
                    style={{
                      fontFamily: "var(--font-montserrat)",
                      fontSize: "var(--text-sm)",
                      fontWeight: state === "current" ? "var(--weight-semibold)" : "var(--weight-regular)",
                      color: state === "pending" ? "var(--white-faint)" : "var(--white)",
                    }}
                  >
                    {step.label}
                  </p>
                  {step.timestamp && state !== "pending" && (
                    <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                      {formatDateTime(step.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
