"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "@heroui/react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import { ConfirmModal } from "../../_components/confirm-modal";

interface Address {
  id: string;
  label: string;
  full_name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
  phone: string;
  is_default: boolean;
}

interface CustomerDetail {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_email_verified: boolean;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  addresses: Address[];
  order_count: number;
  total_spent: number;
}

function formatPrice(p: number): string { return `£${(p / 100).toFixed(2)}`; }
function formatDate(s: string): string { return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmBan, setConfirmBan] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    apiClient.get<{ status: string; data: CustomerDetail }>(endpoints.admin.customers.detail(id))
      .then((r) => setCustomer(r.data))
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleActive() {
    if (!customer) return;
    setUpdating(true);
    try {
      const res = await apiClient.patch<{ status: string; data: CustomerDetail }>(
        endpoints.admin.customers.detail(id),
        { is_active: !customer.is_active },
      );
      setCustomer(res.data);
      toast.success(customer.is_active ? "Customer banned" : "Customer reactivated");
    } catch {
      toast.danger("Update failed");
    } finally {
      setUpdating(false);
      setConfirmBan(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} /></div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-lg py-16 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>Customer not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/customers" className="inline-flex w-fit items-center gap-2 transition-colors duration-200 hover:text-[var(--gold)]" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" }}>
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
            {customer.first_name} {customer.last_name}
          </h1>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
            {customer.email} {!customer.is_active && <span style={{ color: "var(--error)" }}>· Banned</span>}
          </p>
        </div>
        <button onClick={() => setConfirmBan(true)} className="rounded-md px-4 py-2.5" style={{ border: `1px solid ${customer.is_active ? "var(--error)" : "var(--success)"}`, color: customer.is_active ? "var(--error)" : "var(--success)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)" }}>
          {customer.is_active ? "Ban Customer" : "Unban Customer"}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-5)" }}>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>Total Spent</p>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-2xl)", color: "var(--gold-dark)", fontWeight: "var(--weight-medium)" }}>
            {formatPrice(customer.total_spent)}
          </p>
        </div>
        <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-5)" }}>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>Orders</p>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-2xl)", color: "var(--white)", fontWeight: "var(--weight-medium)" }}>
            {customer.order_count}
          </p>
        </div>
        <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-5)" }}>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>Joined</p>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-base)", color: "var(--white)" }}>
            {formatDate(customer.date_joined)}
          </p>
        </div>
      </div>

      <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
        <h2 className="mb-4" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
          Profile
        </h2>
        <div className="grid gap-3 text-sm md:grid-cols-2" style={{ fontFamily: "var(--font-montserrat)", color: "var(--white-dim)" }}>
          <div>Email: <span style={{ color: "var(--white)" }}>{customer.email}</span></div>
          <div>Phone: <span style={{ color: "var(--white)" }}>{customer.phone || "—"}</span></div>
          <div>Verified: <span style={{ color: customer.is_email_verified ? "var(--success)" : "var(--warning)" }}>{customer.is_email_verified ? "Yes" : "No"}</span></div>
          <div>Staff: <span style={{ color: "var(--white)" }}>{customer.is_staff ? "Yes" : "No"}</span></div>
        </div>
      </div>

      {customer.addresses.length > 0 && (
        <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
          <h2 className="mb-4" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
            Addresses ({customer.addresses.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {customer.addresses.map((a) => (
              <div key={a.id} className="rounded-md" style={{ background: "var(--bg-tertiary)", padding: "var(--space-4)" }}>
                {a.is_default && <span className="mb-2 inline-block rounded-full px-2 py-0.5" style={{ background: "rgba(187,148,41,0.15)", color: "var(--gold-dark)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase" }}>Default</span>}
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white)", fontWeight: "var(--weight-medium)" }}>{a.full_name}</p>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", lineHeight: "var(--leading-relaxed)" }}>
                  {a.address_line_1}{a.address_line_2 && `, ${a.address_line_2}`}<br />
                  {a.city}{a.county ? `, ${a.county}` : ""} {a.postcode}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmBan}
        title={customer.is_active ? "Ban Customer?" : "Unban Customer?"}
        message={customer.is_active ? "This will deactivate their account. They won't be able to log in or place orders." : "Reactivate this customer's account?"}
        confirmLabel={customer.is_active ? "Ban" : "Unban"}
        destructive={customer.is_active}
        loading={updating}
        onConfirm={toggleActive}
        onCancel={() => setConfirmBan(false)}
      />
    </div>
  );
}
