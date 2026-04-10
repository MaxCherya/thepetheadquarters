"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ShippingAddressData } from "@/lib/validations/checkout";
import type enCheckout from "@/i18n/dictionaries/en/checkout.json";

interface ShippingFormProps {
  dict: typeof enCheckout;
  isGuest: boolean;
  defaultEmail?: string;
  onSubmit: (address: ShippingAddressData, email?: string) => void;
  onBack?: () => void;
}

const schema = z.object({
  email: z.string(),
  full_name: z.string().min(1, "checkout.full_name_required").max(255),
  address_line_1: z.string().min(1, "checkout.address_required").max(255),
  address_line_2: z.string().max(255),
  city: z.string().min(1, "checkout.city_required").max(100),
  county: z.string().max(100),
  postcode: z.string().min(1, "checkout.postcode_required").max(10),
  country: z.string().length(2),
  phone: z.string().max(20),
});

type FormData = z.infer<typeof schema>;

export function ShippingForm({ dict, isGuest, defaultEmail, onSubmit, onBack }: ShippingFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: defaultEmail || "",
      country: "GB",
      full_name: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      county: "",
      postcode: "",
      phone: "",
    },
  });

  const errorMessages: Record<string, string> = {
    "checkout.email_required": "Email is required.",
    "checkout.email_invalid": "Please enter a valid email address.",
    "checkout.full_name_required": dict.errors.full_name_required,
    "checkout.address_required": dict.errors.address_required,
    "checkout.city_required": dict.errors.city_required,
    "checkout.postcode_required": dict.errors.postcode_required,
  };

  function getError(field: keyof FormData): string | null {
    const err = errors[field];
    if (!err?.message) return null;
    return errorMessages[err.message as string] ?? (err.message as string);
  }

  function onFormSubmit(data: FormData) {
    if (isGuest) {
      if (!data.email || data.email.trim().length === 0) {
        setError("email", { message: "checkout.email_required" });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        setError("email", { message: "checkout.email_invalid" });
        return;
      }
    }
    const address: ShippingAddressData = {
      full_name: data.full_name,
      address_line_1: data.address_line_1,
      address_line_2: data.address_line_2 || "",
      city: data.city,
      county: data.county || "",
      postcode: data.postcode,
      country: data.country,
      phone: data.phone || "",
    };
    onSubmit(address, isGuest ? data.email : undefined);
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

  const errorStyle = {
    fontFamily: "var(--font-montserrat)",
    fontSize: "var(--text-xs)",
    color: "var(--error)",
    marginTop: "var(--space-1)",
  };

  return (
    <div className="mx-auto max-w-lg rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-8)" }}>
      <h2
        className="mb-6"
        style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-2xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}
      >
        {dict.shipping.title}
      </h2>

      {isGuest && (
        <p className="mb-4" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
          {dict.guestNote}
        </p>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-5" noValidate>
        {isGuest && (
          <div>
            <label style={labelStyle}>
              {dict.shipping.email} <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder={dict.shipping.emailPlaceholder}
              className="w-full outline-none"
              style={inputStyle(!!errors.email)}
            />
            {getError("email") && <p style={errorStyle}>{getError("email")}</p>}
          </div>
        )}

        <div>
          <label style={labelStyle}>
            {dict.shipping.fullName} <span style={{ color: "var(--error)" }}>*</span>
          </label>
          <input {...register("full_name")} className="w-full outline-none" style={inputStyle(!!errors.full_name)} />
          {getError("full_name") && <p style={errorStyle}>{getError("full_name")}</p>}
        </div>

        <div>
          <label style={labelStyle}>
            {dict.shipping.addressLine1} <span style={{ color: "var(--error)" }}>*</span>
          </label>
          <input {...register("address_line_1")} className="w-full outline-none" style={inputStyle(!!errors.address_line_1)} />
          {getError("address_line_1") && <p style={errorStyle}>{getError("address_line_1")}</p>}
        </div>

        <div>
          <label style={labelStyle}>{dict.shipping.addressLine2}</label>
          <input {...register("address_line_2")} className="w-full outline-none" style={inputStyle(false)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>
              {dict.shipping.city} <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input {...register("city")} className="w-full outline-none" style={inputStyle(!!errors.city)} />
            {getError("city") && <p style={errorStyle}>{getError("city")}</p>}
          </div>
          <div>
            <label style={labelStyle}>{dict.shipping.county}</label>
            <input {...register("county")} className="w-full outline-none" style={inputStyle(false)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>
              {dict.shipping.postcode} <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input {...register("postcode")} className="w-full outline-none" style={inputStyle(!!errors.postcode)} />
            {getError("postcode") && <p style={errorStyle}>{getError("postcode")}</p>}
          </div>
          <div>
            <label style={labelStyle}>{dict.shipping.phone}</label>
            <input {...register("phone")} type="tel" className="w-full outline-none" style={inputStyle(false)} />
          </div>
        </div>

        <div className="flex gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-md px-6 py-3 transition-all duration-200"
              style={{ border: "1px solid var(--bg-border)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}
            >
              Back
            </button>
          )}
          <button
            type="submit"
            className="btn-gold flex-1 rounded-md py-3 transition-all duration-300 hover:-translate-y-0.5"
            style={{ fontFamily: "var(--font-montserrat)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", letterSpacing: "var(--tracking-wider)", textTransform: "uppercase" }}
          >
            {dict.shipping.continue}
          </button>
        </div>
      </form>
    </div>
  );
}
