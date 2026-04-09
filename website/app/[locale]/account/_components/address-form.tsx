"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import { addressSchema, type AddressFormData } from "@/lib/validations/auth";
import type { Address } from "@/types/auth";
import type enAuth from "@/i18n/dictionaries/en/auth.json";

interface AddressFormProps {
  dict: typeof enAuth;
  address: Address | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function AddressForm({ dict, address, onSaved, onCancel }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: address
      ? {
          label: address.label,
          full_name: address.full_name,
          address_line_1: address.address_line_1,
          address_line_2: address.address_line_2,
          city: address.city,
          county: address.county,
          postcode: address.postcode,
          country: address.country,
          phone: address.phone,
          is_default: address.is_default,
        }
      : { country: "GB", is_default: false },
  });

  async function onSubmit(data: AddressFormData) {
    if (address) {
      await apiClient.patch(endpoints.addresses.detail(address.id), data);
    } else {
      await apiClient.post(endpoints.addresses.list, data);
    }
    onSaved();
  }

  const labelStyle = {
    fontFamily: "var(--font-montserrat)",
    fontSize: "var(--text-xs)" as const,
    fontWeight: "var(--weight-medium)" as const,
    color: "var(--white-dim)",
    letterSpacing: "var(--tracking-wide)",
    textTransform: "uppercase" as const,
    display: "block" as const,
    marginBottom: "var(--space-2)",
  };

  const inputStyle = (hasError: boolean) => ({
    background: "var(--bg-tertiary)",
    border: `1px solid ${hasError ? "var(--error)" : "var(--bg-border)"}`,
    color: "var(--white)",
    fontFamily: "var(--font-montserrat)",
    fontSize: "var(--text-sm)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-3) var(--space-4)",
  });

  return (
    <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-8)" }}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div>
          <label style={labelStyle}>{dict.addresses.label}</label>
          <input {...register("label")} placeholder={dict.addresses.labelPlaceholder} className="w-full outline-none" style={inputStyle(false)} />
        </div>

        <div>
          <label style={labelStyle}>{dict.addresses.fullName}</label>
          <input {...register("full_name")} className="w-full outline-none" style={inputStyle(!!errors.full_name)} />
        </div>

        <div>
          <label style={labelStyle}>{dict.addresses.addressLine1}</label>
          <input {...register("address_line_1")} className="w-full outline-none" style={inputStyle(!!errors.address_line_1)} />
        </div>

        <div>
          <label style={labelStyle}>{dict.addresses.addressLine2}</label>
          <input {...register("address_line_2")} className="w-full outline-none" style={inputStyle(false)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>{dict.addresses.city}</label>
            <input {...register("city")} className="w-full outline-none" style={inputStyle(!!errors.city)} />
          </div>
          <div>
            <label style={labelStyle}>{dict.addresses.county}</label>
            <input {...register("county")} className="w-full outline-none" style={inputStyle(false)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>{dict.addresses.postcode}</label>
            <input {...register("postcode")} className="w-full outline-none" style={inputStyle(!!errors.postcode)} />
          </div>
          <div>
            <label style={labelStyle}>{dict.addresses.phone}</label>
            <input {...register("phone")} type="tel" className="w-full outline-none" style={inputStyle(false)} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input {...register("is_default")} type="checkbox" id="is_default" style={{ accentColor: "var(--gold)" }} />
          <label htmlFor="is_default" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
            {dict.addresses.setDefault}
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-gold rounded-md px-8 py-3 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
            style={{ fontFamily: "var(--font-montserrat)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", letterSpacing: "var(--tracking-wider)", textTransform: "uppercase" }}
          >
            {isSubmitting ? "..." : dict.addresses.save}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-6 py-3 transition-all duration-200"
            style={{ border: "1px solid var(--bg-border)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
