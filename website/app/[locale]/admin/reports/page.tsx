"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Package, Receipt, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";

interface PromotionsReport {
  date_from: string;
  date_to: string;
  totals: {
    redemption_count: number;
    total_discount_pence: number;
    total_revenue_pence: number;
  };
  per_code: Array<{
    promotion_id: string;
    code: string;
    name: string;
    source: string;
    discount_type: string;
    discount_value: number;
    redemption_count: number;
    total_discount_pence: number;
    total_revenue_pence: number;
  }>;
  per_source: Array<{
    source: string;
    redemption_count: number;
    total_discount_pence: number;
    total_revenue_pence: number;
  }>;
}

interface SalesReport {
  date_from: string;
  date_to: string;
  orders_count: number;
  revenue_pence: number;
  revenue_net_vat_pence: number;
  vat_collected_pence: number;
  cogs_pence: number;
  gross_profit_pence: number;
  gross_margin_percent: number;
}

interface VatReport {
  date_from: string;
  date_to: string;
  sales_vat_pence: number;
  purchase_vat_pence: number;
  net_vat_due_pence: number;
}

interface InventoryValuation {
  total_valuation_pence: number;
  total_units: number;
  top_variants: Array<{
    variant_id: string;
    sku: string;
    product_name: string;
    stock_quantity: number;
    valuation_pence: number;
  }>;
}

function formatPrice(p: number): string { return `£${(p / 100).toFixed(2)}`; }

export default function AdminReportsPage() {
  const [sales, setSales] = useState<SalesReport | null>(null);
  const [vat, setVat] = useState<VatReport | null>(null);
  const [valuation, setValuation] = useState<InventoryValuation | null>(null);
  const [promos, setPromos] = useState<PromotionsReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get<{ status: string; data: SalesReport }>(endpoints.admin.reports.sales),
      apiClient.get<{ status: string; data: VatReport }>(endpoints.admin.reports.vatReturn),
      apiClient.get<{ status: string; data: InventoryValuation }>(endpoints.admin.reports.inventoryValuation),
      apiClient.get<{ status: string; data: PromotionsReport }>(endpoints.admin.reports.promotions),
    ])
      .then(([s, v, i, p]) => {
        setSales(s.data);
        setVat(v.data);
        setValuation(i.data);
        setPromos(p.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
        Reports
      </h1>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} /></div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Sales report */}
          {sales && (
            <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp size={20} style={{ color: "var(--gold-dark)" }} />
                  <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", fontWeight: "var(--weight-medium)", color: "var(--white)" }}>Sales (Last 30 days)</h2>
                </div>
                <a href={endpoints.admin.reports.salesExport} className="text-xs" style={{ fontFamily: "var(--font-montserrat)", color: "var(--gold-dark)" }}>Export CSV →</a>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Stat label="Orders" value={String(sales.orders_count)} />
                <Stat label="Revenue (gross)" value={formatPrice(sales.revenue_pence)} />
                <Stat label="COGS" value={formatPrice(sales.cogs_pence)} />
                <Stat label="Gross Profit" value={formatPrice(sales.gross_profit_pence)} highlight />
              </div>
              <p className="mt-4" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                Margin: {sales.gross_margin_percent}% (net of VAT)
              </p>
            </div>
          )}

          {/* VAT report */}
          {vat && (
            <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt size={20} style={{ color: "var(--gold-dark)" }} />
                  <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", fontWeight: "var(--weight-medium)", color: "var(--white)" }}>VAT Return (Last 30 days)</h2>
                </div>
                <a href={endpoints.admin.reports.vatReturnExport} className="text-xs" style={{ fontFamily: "var(--font-montserrat)", color: "var(--gold-dark)" }}>Export CSV →</a>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Stat label="Sales VAT collected" value={formatPrice(vat.sales_vat_pence)} />
                <Stat label="Purchase VAT paid" value={formatPrice(vat.purchase_vat_pence)} />
                <Stat label="Net VAT due to HMRC" value={formatPrice(vat.net_vat_due_pence)} highlight />
              </div>
            </div>
          )}

          {/* Inventory valuation */}
          {valuation && (
            <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
              <div className="mb-4 flex items-center gap-3">
                <Package size={20} style={{ color: "var(--gold-dark)" }} />
                <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", fontWeight: "var(--weight-medium)", color: "var(--white)" }}>Inventory Valuation</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Total stock value" value={formatPrice(valuation.total_valuation_pence)} highlight />
                <Stat label="Total units" value={String(valuation.total_units)} />
              </div>
              {valuation.top_variants.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>Top by value</p>
                  {valuation.top_variants.slice(0, 10).map((v) => (
                    <div key={v.variant_id} className="flex items-center justify-between" style={{ padding: "var(--space-2) 0", borderBottom: "1px solid var(--bg-border)" }}>
                      <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-dim)" }}>
                        {v.product_name} ({v.sku}) · {v.stock_quantity} units
                      </span>
                      <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--gold-dark)" }}>
                        {formatPrice(v.valuation_pence)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Promotions report */}
          {promos && (
            <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
              <div className="mb-4 flex items-center gap-3">
                <Sparkles size={20} style={{ color: "var(--gold-dark)" }} />
                <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", fontWeight: "var(--weight-medium)", color: "var(--white)" }}>
                  Promotions (Last 30 days)
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Stat label="Redemptions" value={String(promos.totals.redemption_count)} />
                <Stat label="Total discounted" value={formatPrice(promos.totals.total_discount_pence)} />
                <Stat label="Revenue from codes" value={formatPrice(promos.totals.total_revenue_pence)} highlight />
              </div>

              {promos.per_code.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
                    Top codes
                  </p>
                  {promos.per_code.slice(0, 10).map((row) => (
                    <Link
                      key={row.promotion_id}
                      href={`/admin/promotions/${row.promotion_id}`}
                      className="flex items-center justify-between transition-colors duration-200 hover:bg-[rgba(187,148,41,0.05)]"
                      style={{ padding: "var(--space-2) var(--space-3)", borderBottom: "1px solid var(--bg-border)" }}
                    >
                      <div>
                        <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--white)", letterSpacing: "var(--tracking-wide)" }}>
                          {row.code}
                        </span>
                        <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "11px", color: "var(--white-faint)", marginLeft: "var(--space-2)" }}>
                          {row.name} · {row.source}
                        </span>
                      </div>
                      <div className="text-right">
                        <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-dim)" }}>
                          {row.redemption_count} uses
                        </span>
                        <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--gold-dark)", marginLeft: "var(--space-3)" }}>
                          {formatPrice(row.total_revenue_pence)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {promos.per_source.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
                    By source
                  </p>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {promos.per_source.map((row) => (
                      <div key={row.source} className="rounded-md" style={{ background: "var(--bg-tertiary)", padding: "var(--space-3)" }}>
                        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "11px", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
                          {row.source}
                        </p>
                        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-lg)", color: "var(--white)" }}>
                          {row.redemption_count} uses
                        </p>
                        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "11px", color: "var(--gold-dark)" }}>
                          {formatPrice(row.total_revenue_pence)} revenue
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)", marginBottom: "var(--space-1)" }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", fontWeight: "var(--weight-medium)", color: highlight ? "var(--gold-dark)" : "var(--white)" }}>
        {value}
      </p>
    </div>
  );
}
