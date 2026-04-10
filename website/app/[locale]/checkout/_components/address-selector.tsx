"use client";

import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import type { Address } from "@/types/auth";
import type enCheckout from "@/i18n/dictionaries/en/checkout.json";

interface AddressSelectorProps {
  dict: typeof enCheckout;
  addresses: Address[];
  onSelect: (address: { full_name: string; address_line_1: string; address_line_2: string; city: string; county: string; postcode: string; country: string; phone: string }, addressId: string) => void;
  onNewAddress: () => void;
}

export function AddressSelector({ dict, addresses, onSelect, onNewAddress }: AddressSelectorProps) {
  const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
  const [selectedId, setSelectedId] = useState(defaultAddr?.id || "");

  function handleContinue() {
    const addr = addresses.find((a) => a.id === selectedId);
    if (!addr) return;
    onSelect(
      {
        full_name: addr.full_name,
        address_line_1: addr.address_line_1,
        address_line_2: addr.address_line_2,
        city: addr.city,
        county: addr.county,
        postcode: addr.postcode,
        country: addr.country,
        phone: addr.phone,
      },
      addr.id,
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2
        className="mb-6"
        style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-2xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}
      >
        {dict.shipping.savedAddresses}
      </h2>

      <div className="flex flex-col gap-3">
        {addresses.map((addr) => (
          <button
            key={addr.id}
            type="button"
            onClick={() => setSelectedId(addr.id)}
            className="w-full rounded-lg text-left transition-all duration-200"
            style={{
              background: "var(--bg-secondary)",
              border: `1.5px solid ${selectedId === addr.id ? "var(--gold)" : "var(--bg-border)"}`,
              padding: "var(--space-5)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{
                  border: `2px solid ${selectedId === addr.id ? "var(--gold)" : "var(--bg-border)"}`,
                }}
              >
                {selectedId === addr.id && (
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--gold)" }} />
                )}
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--white)" }}>
                  {addr.full_name}
                  {addr.is_default && (
                    <span className="ml-2 rounded-full px-2 py-0.5" style={{ background: "rgba(187,148,41,0.12)", color: "var(--gold-dark)", fontSize: "var(--text-xs)" }}>
                      Default
                    </span>
                  )}
                </p>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)", lineHeight: "var(--leading-relaxed)" }}>
                  {addr.address_line_1}, {addr.city} {addr.postcode}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onNewAddress}
        className="mt-4 flex items-center gap-2 transition-colors duration-200 hover:text-[var(--gold)]"
        style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--gold-dark)" }}
      >
        <Plus size={14} />
        {dict.shipping.newAddress}
      </button>

      <button
        onClick={handleContinue}
        disabled={!selectedId}
        className="btn-gold mt-6 w-full rounded-md py-3 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
        style={{ fontFamily: "var(--font-montserrat)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", letterSpacing: "var(--tracking-wider)", textTransform: "uppercase" }}
      >
        {dict.shipping.continue}
      </button>
    </div>
  );
}
