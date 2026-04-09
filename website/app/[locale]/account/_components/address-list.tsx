"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@heroui/react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { Address } from "@/types/auth";
import type enAuth from "@/i18n/dictionaries/en/auth.json";
import { AddressForm } from "./address-form";

interface AddressListProps {
  dict: typeof enAuth;
}

export function AddressList({ dict }: AddressListProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await apiClient.get<{ status: string; data: Address[] }>(endpoints.addresses.list);
      setAddresses(res.data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  async function handleDelete(id: string) {
    if (!confirm(dict.addresses.deleteConfirm)) return;
    try {
      await apiClient.del(endpoints.addresses.detail(id));
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success(dict.addresses.deleted);
    } catch {
      toast.danger("Something went wrong.");
    }
  }

  function handleSaved() {
    setShowForm(false);
    setEditing(null);
    fetchAddresses();
    toast.success(dict.addresses.saved);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} />
      </div>
    );
  }

  if (showForm || editing) {
    return (
      <AddressForm
        dict={dict}
        address={editing}
        onSaved={handleSaved}
        onCancel={() => { setShowForm(false); setEditing(null); }}
      />
    );
  }

  return (
    <div>
      <button
        onClick={() => setShowForm(true)}
        className="mb-6 flex items-center gap-2 rounded-md px-4 py-2.5 transition-all duration-200 hover:border-[var(--gold)]"
        style={{ border: "1px solid var(--bg-border)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--gold-dark)" }}
      >
        <Plus size={16} />
        {dict.addresses.add}
      </button>

      {addresses.length === 0 ? (
        <div className="rounded-lg py-12 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          <MapPin size={32} className="mx-auto mb-3" style={{ color: "var(--white-faint)" }} />
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
            {dict.addresses.noAddresses}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-lg"
              style={{ background: "var(--bg-secondary)", border: `1px solid ${address.is_default ? "var(--gold)" : "var(--bg-border)"}`, padding: "var(--space-5)" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  {address.is_default && (
                    <span
                      className="mb-2 inline-block rounded-full px-2.5 py-0.5"
                      style={{ background: "rgba(187,148,41,0.12)", color: "var(--gold-dark)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)" }}
                    >
                      {dict.addresses.default}
                    </span>
                  )}
                  {address.label && (
                    <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)", marginBottom: "var(--space-1)" }}>
                      {address.label}
                    </p>
                  )}
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--white)" }}>
                    {address.full_name}
                  </p>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)", lineHeight: "var(--leading-relaxed)" }}>
                    {address.address_line_1}
                    {address.address_line_2 && <>, {address.address_line_2}</>}
                    <br />
                    {address.city}{address.county ? `, ${address.county}` : ""}, {address.postcode}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(address)}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-[rgba(187,148,41,0.1)]"
                    style={{ color: "var(--white-faint)" }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-[rgba(198,40,40,0.1)]"
                    style={{ color: "var(--white-faint)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
