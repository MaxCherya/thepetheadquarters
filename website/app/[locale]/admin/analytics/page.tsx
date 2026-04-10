"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users, Eye, MousePointer, ArrowRight, Globe, Monitor, Smartphone } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { AnalyticsOverview } from "@/types/admin";

const PRESETS = [
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
];

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-GB").format(n);
}

function dateFromPreset(days: number): { date_from: string; date_to: string } {
  const today = new Date();
  const past = new Date();
  past.setDate(today.getDate() - (days - 1));
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { date_from: fmt(past), date_to: fmt(today) };
}

export default function AdminAnalyticsPage() {
  const [preset, setPreset] = useState("30");
  const range = dateFromPreset(parseInt(preset, 10));

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", "overview", range.date_from, range.date_to],
    queryFn: async () => {
      const res = await apiClient.get<{ status: string; data: AnalyticsOverview }>(
        `${endpoints.admin.analytics.overview}?date_from=${range.date_from}&date_to=${range.date_to}`,
      );
      return res.data;
    },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
          Analytics
        </h1>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPreset(p.key)}
              className="rounded-md px-3 py-1.5"
              style={{
                background: preset === p.key ? "rgba(187,148,41,0.12)" : "var(--bg-secondary)",
                border: `1px solid ${preset === p.key ? "var(--gold)" : "var(--bg-border)"}`,
                color: preset === p.key ? "var(--gold-dark)" : "var(--white-dim)",
                fontFamily: "var(--font-montserrat)",
                fontSize: "var(--text-xs)",
                fontWeight: preset === p.key ? "var(--weight-semibold)" : "var(--weight-regular)",
              }}
            >
              {p.label}
            </button>
          ))}
          <Link
            href="/admin/analytics/visitors"
            className="rounded-md px-3 py-1.5"
            style={{
              background: "var(--gold)",
              color: "#FFFFFF",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--weight-semibold)",
              textTransform: "uppercase",
              letterSpacing: "var(--tracking-wide)",
            }}
          >
            Inspect visitors →
          </Link>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <Stat label="Visitors" value={formatNumber(data.totals.visitors)} icon={Users} />
            <Stat label="Sessions" value={formatNumber(data.totals.sessions)} icon={MousePointer} />
            <Stat label="Pageviews" value={formatNumber(data.totals.pageviews)} icon={Eye} highlight />
            <Stat label="Pages / Session" value={String(data.totals.avg_pages_per_session)} />
            <Stat label="Bounce rate" value={`${data.totals.bounce_rate}%`} />
          </div>

          {/* Time series chart (simple SVG) */}
          <TimeSeriesChart data={data.time_series} />

          {/* Conversion funnel */}
          <FunnelChart funnel={data.funnel} />

          {/* Three-column lower row */}
          <div className="grid gap-4 md:grid-cols-3">
            <ListCard title="Top pages" items={data.top_pages.slice(0, 10).map((r) => ({
              label: r.path,
              right: `${formatNumber(r.views)} views`,
              sub: `${r.unique_visitors} unique`,
            }))} />
            <ListCard title="Top referrers" items={data.top_referrers.map((r) => ({
              label: r.referrer_host,
              right: `${r.sessions} sessions`,
            }))} emptyText="Direct traffic only" />
            <ListCard title="Top countries" icon={Globe} items={data.top_countries.map((r) => ({
              label: r.country,
              right: `${r.visitors} visitors`,
            }))} />
          </div>

          {/* Devices + browsers row */}
          <div className="grid gap-4 md:grid-cols-2">
            <ListCard title="Devices" icon={Monitor} items={data.devices.map((r) => ({
              label: r.device_type,
              right: `${r.visitors}`,
            }))} />
            <ListCard title="Browsers" items={data.browsers.map((r) => ({
              label: r.browser,
              right: `${r.visitors}`,
            }))} />
          </div>

          {data.utm_sources.length > 0 && (
            <ListCard title="UTM sources" items={data.utm_sources.map((r) => ({
              label: r.utm_source,
              right: `${r.sessions} sessions`,
            }))} />
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
interface StatProps {
  label: string;
  value: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  highlight?: boolean;
}

function Stat({ label, value, icon: Icon, highlight }: StatProps) {
  return (
    <div className="rounded-lg" style={{
      background: "var(--bg-secondary)",
      border: `1px solid ${highlight ? "var(--gold)" : "var(--bg-border)"}`,
      padding: "var(--space-5)",
    }}>
      <div className="mb-2 flex items-center justify-between">
        <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
          {label}
        </span>
        {Icon && <Icon size={14} style={{ color: highlight ? "var(--gold)" : "var(--gold-dark)" }} />}
      </div>
      <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", color: "var(--white)" }}>
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Time series — minimal inline SVG, no chart library
// ---------------------------------------------------------------------------
interface TimeSeriesChartProps {
  data: Array<{ date: string; visitors: number; pageviews: number }>;
}

function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const width = 800;
  const height = 200;
  const padding = { top: 16, right: 20, bottom: 24, left: 40 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(1, ...data.map((d) => Math.max(d.visitors, d.pageviews)));
  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : 0;

  const linePath = (key: "visitors" | "pageviews") =>
    data
      .map((d, i) => {
        const x = padding.left + i * stepX;
        const y = padding.top + innerHeight - (d[key] / maxValue) * innerHeight;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-5)" }}>
      <div className="mb-3 flex items-center justify-between">
        <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", color: "var(--white)" }}>
          Traffic over time
        </h2>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-dim)" }}>
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--gold)" }} />
            Pageviews
          </span>
          <span className="flex items-center gap-1.5" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-dim)" }}>
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--info)" }} />
            Visitors
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padding.top + innerHeight * t;
          return (
            <line
              key={t}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="var(--bg-border)"
              strokeDasharray="2 4"
            />
          );
        })}
        {/* Y-axis labels */}
        {[1, 0.5, 0].map((t) => (
          <text
            key={t}
            x={padding.left - 6}
            y={padding.top + innerHeight * (1 - t) + 4}
            textAnchor="end"
            fill="var(--white-faint)"
            fontFamily="var(--font-montserrat)"
            fontSize="10"
          >
            {Math.round(maxValue * t)}
          </text>
        ))}
        {/* Pageviews line (gold) */}
        <path d={linePath("pageviews")} stroke="var(--gold)" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {/* Visitors line (info) */}
        <path d={linePath("visitors")} stroke="var(--info)" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Funnel
// ---------------------------------------------------------------------------
interface FunnelProps {
  funnel: AnalyticsOverview["funnel"];
}

function FunnelChart({ funnel }: FunnelProps) {
  const steps = [
    { key: "visitors", label: "Visitors", value: funnel.visitors },
    { key: "product_views", label: "Viewed a product", value: funnel.product_views },
    { key: "add_to_cart", label: "Added to cart", value: funnel.add_to_cart },
    { key: "checkout_start", label: "Started checkout", value: funnel.checkout_start },
    { key: "checkout_complete", label: "Completed purchase", value: funnel.checkout_complete },
  ];

  const max = Math.max(1, funnel.visitors);

  return (
    <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-5)" }}>
      <h2 className="mb-4" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", color: "var(--white)" }}>
        Conversion funnel
      </h2>
      <div className="flex flex-col gap-2">
        {steps.map((step, i) => {
          const pct = max > 0 ? (step.value / max) * 100 : 0;
          const dropFromPrev =
            i > 0 && steps[i - 1].value > 0
              ? Math.round((1 - step.value / steps[i - 1].value) * 100)
              : 0;
          return (
            <div key={step.key}>
              <div className="mb-1 flex items-center justify-between gap-4">
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-dim)" }}>
                  {step.label}
                </span>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white)", fontWeight: "var(--weight-semibold)" }}>
                  {formatNumber(step.value)}
                  {i > 0 && dropFromPrev > 0 && (
                    <span style={{ color: "var(--white-faint)", fontWeight: "var(--weight-regular)" }}>
                      {" "}
                      (-{dropFromPrev}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full" style={{ background: "var(--bg-tertiary)" }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: "var(--gold)" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generic list card
// ---------------------------------------------------------------------------
interface ListCardItem {
  label: string;
  right: string;
  sub?: string;
}

interface ListCardProps {
  title: string;
  items: ListCardItem[];
  emptyText?: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

function ListCard({ title, items, emptyText = "No data yet", icon: Icon }: ListCardProps) {
  return (
    <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-5)" }}>
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon size={14} style={{ color: "var(--gold-dark)" }} />}
        <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-lg)", color: "var(--white)" }}>
          {title}
        </h3>
      </div>
      {items.length === 0 ? (
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
          {emptyText}
        </p>
      ) : (
        <div className="flex flex-col">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3"
              style={{
                padding: "var(--space-2) 0",
                borderBottom: i < items.length - 1 ? "1px solid var(--bg-border)" : "none",
              }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-dim)" }}>
                  {item.label}
                </p>
                {item.sub && (
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "var(--white-faint)" }}>
                    {item.sub}
                  </p>
                )}
              </div>
              <span className="shrink-0" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--gold-dark)", fontWeight: "var(--weight-semibold)" }}>
                {item.right}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
