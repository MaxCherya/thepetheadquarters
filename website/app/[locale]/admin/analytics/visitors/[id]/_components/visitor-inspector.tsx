"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Monitor, Smartphone, Tablet, Globe, Clock, FileText, Zap } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { AnalyticsVisitorDetail } from "@/types/admin";

interface VisitorInspectorProps {
  visitorId: string;
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

function formatTime(s: string): string {
  return new Date(s).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function deviceIcon(type: string) {
  switch (type) {
    case "mobile":
      return Smartphone;
    case "tablet":
      return Tablet;
    default:
      return Monitor;
  }
}

function eventColor(name: string): string {
  if (name === "checkout_complete" || name === "signup") return "var(--success)";
  if (name === "checkout_start" || name === "add_to_cart") return "var(--gold-dark)";
  if (name === "remove_from_cart") return "var(--error)";
  return "var(--info)";
}

export function VisitorInspector({ visitorId }: VisitorInspectorProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", "visitor", visitorId],
    queryFn: async () => {
      const res = await apiClient.get<{ status: string; data: AnalyticsVisitorDetail }>(
        endpoints.admin.analytics.visitor(visitorId),
      );
      return res.data;
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} />
      </div>
    );
  }

  const DeviceIcon = deviceIcon(data.device_type);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/analytics/visitors"
          className="mb-2 inline-flex items-center gap-1"
          style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}
        >
          <ArrowLeft size={12} />
          Back to visitors
        </Link>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
          {data.user ? `${data.user.first_name} ${data.user.last_name || ""}`.trim() || data.user.email : "Anonymous visitor"}
        </h1>
        {data.user && (
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
            <Link href={`/admin/customers/${data.user.id}`} style={{ color: "var(--gold-dark)" }}>
              {data.user.email}
            </Link>
          </p>
        )}
      </div>

      {/* Visitor metadata cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetaCard label="First seen" value={formatDateTime(data.first_seen_at)} icon={Clock} />
        <MetaCard label="Last seen" value={formatDateTime(data.last_seen_at)} icon={Clock} />
        <MetaCard
          label="Device"
          value={`${data.browser || "Unknown"} on ${data.os || "Unknown"}`}
          icon={DeviceIcon}
        />
        <MetaCard
          label="Country"
          value={data.country || "Unknown"}
          icon={Globe}
        />
      </div>

      {/* Order summary if linked to a customer */}
      {data.order_summary && (
        <div className="rounded-lg" style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--gold)",
          padding: "var(--space-5)",
        }}>
          <h2 className="mb-3" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", color: "var(--white)" }}>
            Customer summary
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <SummaryStat label="Orders" value={String(data.order_summary.order_count)} />
            <SummaryStat label="Total spent" value={`£${(data.order_summary.total_spent_pence / 100).toFixed(2)}`} />
            <SummaryStat
              label="Last order"
              value={data.order_summary.last_order_at ? formatDateTime(data.order_summary.last_order_at) : "—"}
            />
          </div>
        </div>
      )}

      {/* Sessions timeline */}
      <div>
        <h2 className="mb-3" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-2xl)", color: "var(--white)" }}>
          Session history ({data.sessions.length})
        </h2>
        {data.sessions.length === 0 ? (
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
            No sessions recorded yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {data.sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-lg"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--bg-border)",
                  padding: "var(--space-5)",
                }}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--white)" }}>
                      {formatDateTime(session.started_at)}
                    </p>
                    <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "11px", color: "var(--white-faint)" }}>
                      {session.pageview_count} pageviews · {session.event_count} events
                      {session.referrer_host && ` · from ${session.referrer_host}`}
                      {session.utm_source && ` · utm: ${session.utm_source}`}
                    </p>
                  </div>
                </div>

                {/* Combined timeline of pageviews + events */}
                <div className="flex flex-col gap-1.5" style={{ borderLeft: "2px solid var(--bg-border)", paddingLeft: "var(--space-4)" }}>
                  {[
                    ...session.pageviews.map((p) => ({
                      kind: "pageview" as const,
                      at: p.viewed_at,
                      label: p.path,
                      sub: p.title,
                    })),
                    ...session.events.map((e) => ({
                      kind: "event" as const,
                      at: e.occurred_at,
                      label: e.name,
                      sub: Object.keys(e.properties).length > 0
                        ? Object.entries(e.properties).map(([k, v]) => `${k}=${v}`).join(", ")
                        : "",
                    })),
                  ]
                    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
                    .map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {item.kind === "pageview" ? (
                          <FileText size={11} style={{ color: "var(--white-faint)", flexShrink: 0 }} />
                        ) : (
                          <Zap size={11} style={{ color: eventColor(item.label), flexShrink: 0 }} />
                        )}
                        <span
                          style={{
                            fontFamily: "var(--font-montserrat)",
                            fontSize: "10px",
                            color: "var(--white-faint)",
                            minWidth: "60px",
                          }}
                        >
                          {formatTime(item.at)}
                        </span>
                        <span
                          className="min-w-0 truncate"
                          style={{
                            fontFamily: "var(--font-montserrat)",
                            fontSize: "var(--text-xs)",
                            color: item.kind === "event" ? eventColor(item.label) : "var(--white-dim)",
                            fontWeight: item.kind === "event" ? "var(--weight-semibold)" : "var(--weight-regular)",
                          }}
                        >
                          {item.label}
                        </span>
                        {item.sub && (
                          <span
                            className="min-w-0 flex-1 truncate"
                            style={{
                              fontFamily: "var(--font-montserrat)",
                              fontSize: "10px",
                              color: "var(--white-faint)",
                            }}
                          >
                            {item.sub}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface MetaCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

function MetaCard({ label, value, icon: Icon }: MetaCardProps) {
  return (
    <div className="rounded-lg" style={{
      background: "var(--bg-secondary)",
      border: "1px solid var(--bg-border)",
      padding: "var(--space-4)",
    }}>
      <div className="mb-1 flex items-center gap-1.5">
        <Icon size={11} style={{ color: "var(--gold-dark)" }} />
        <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
          {label}
        </span>
      </div>
      <p className="truncate" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white)" }}>
        {value}
      </p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", color: "var(--white)" }}>
        {value}
      </p>
    </div>
  );
}
