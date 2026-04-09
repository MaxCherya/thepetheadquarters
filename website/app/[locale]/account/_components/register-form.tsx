"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@heroui/react";
import { useAuth } from "@/lib/auth-context";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import type enAuth from "@/i18n/dictionaries/en/auth.json";

interface RegisterFormProps {
  dict: typeof enAuth;
}

export function RegisterForm({ dict }: RegisterFormProps) {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const errorMessages: Record<string, string> = {
    "auth.email_required": dict.errors.email_required,
    "auth.email_invalid": dict.errors.email_invalid,
    "auth.password_min_length": dict.errors.password_min_length,
    "auth.confirm_password_required": dict.errors.confirm_password_required,
    "auth.passwords_mismatch": dict.errors.passwords_mismatch,
    "auth.first_name_required": dict.errors.first_name_required,
    "auth.last_name_required": dict.errors.last_name_required,
    "auth.gdpr_required": dict.errors.gdpr_required,
  };

  function getError(field: keyof RegisterFormData) {
    const err = errors[field];
    if (!err?.message) return null;
    return errorMessages[err.message] ?? err.message;
  }

  async function onSubmit(data: RegisterFormData) {
    setServerError("");
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        gdpr_consent: data.gdpr_consent,
      });
      toast.success(dict.register.success);
      router.push("/account/verify-email");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("email_taken")) {
        setServerError(dict.register.emailTaken);
      } else {
        setServerError(message || "Something went wrong.");
      }
    }
  }

  const inputStyle = (hasError: boolean) => ({
    background: "var(--bg-tertiary)",
    border: `1px solid ${hasError ? "var(--error)" : "var(--bg-border)"}`,
    color: "var(--white)",
    fontFamily: "var(--font-montserrat)",
    fontSize: "var(--text-sm)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-3) var(--space-4)",
  });

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

  return (
    <div
      className="rounded-lg"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--bg-border)",
        padding: "var(--space-8)",
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {serverError && (
          <p
            className="rounded-md text-center"
            style={{
              background: "rgba(198,40,40,0.08)",
              border: "1px solid rgba(198,40,40,0.2)",
              color: "var(--error)",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              padding: "var(--space-3)",
            }}
          >
            {serverError}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>{dict.register.firstName}</label>
            <input {...register("first_name")} autoComplete="given-name" className="w-full outline-none" style={inputStyle(!!errors.first_name)} />
            {getError("first_name") && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--error)", marginTop: "var(--space-1)" }}>{getError("first_name")}</p>}
          </div>
          <div>
            <label style={labelStyle}>{dict.register.lastName}</label>
            <input {...register("last_name")} autoComplete="family-name" className="w-full outline-none" style={inputStyle(!!errors.last_name)} />
            {getError("last_name") && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--error)", marginTop: "var(--space-1)" }}>{getError("last_name")}</p>}
          </div>
        </div>

        <div>
          <label style={labelStyle}>{dict.register.email}</label>
          <input {...register("email")} type="email" autoComplete="email" className="w-full outline-none" style={inputStyle(!!errors.email)} />
          {getError("email") && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--error)", marginTop: "var(--space-1)" }}>{getError("email")}</p>}
        </div>

        <div>
          <label style={labelStyle}>{dict.register.password}</label>
          <input {...register("password")} type="password" autoComplete="new-password" className="w-full outline-none" style={inputStyle(!!errors.password)} />
          {getError("password") && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--error)", marginTop: "var(--space-1)" }}>{getError("password")}</p>}
        </div>

        <div>
          <label style={labelStyle}>{dict.register.confirmPassword}</label>
          <input {...register("confirm_password")} type="password" autoComplete="new-password" className="w-full outline-none" style={inputStyle(!!errors.confirm_password)} />
          {getError("confirm_password") && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--error)", marginTop: "var(--space-1)" }}>{getError("confirm_password")}</p>}
        </div>

        <div className="flex items-start gap-3">
          <input
            {...register("gdpr_consent")}
            type="checkbox"
            id="gdpr"
            className="mt-1"
            style={{ accentColor: "var(--gold)" }}
          />
          <label
            htmlFor="gdpr"
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              color: "var(--white-dim)",
              lineHeight: "var(--leading-relaxed)",
            }}
          >
            {dict.register.gdprConsent}{" "}
            <Link href="/legal/privacy" style={{ color: "var(--gold-dark)", textDecoration: "underline" }}>
              {dict.register.privacyPolicy}
            </Link>
            .
          </label>
        </div>
        {getError("gdpr_consent") && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--error)" }}>{getError("gdpr_consent")}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-gold w-full rounded-md py-3 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
          style={{
            fontFamily: "var(--font-montserrat)",
            fontWeight: "var(--weight-semibold)",
            fontSize: "var(--text-sm)",
            letterSpacing: "var(--tracking-wider)",
            textTransform: "uppercase",
          }}
        >
          {isSubmitting ? "..." : dict.register.submit}
        </button>
      </form>

      <p
        className="text-center"
        style={{
          marginTop: "var(--space-6)",
          fontFamily: "var(--font-montserrat)",
          fontSize: "var(--text-sm)",
          color: "var(--white-faint)",
        }}
      >
        {dict.register.hasAccount}{" "}
        <Link href="/account/login" style={{ color: "var(--gold-dark)", fontWeight: "var(--weight-medium)" }}>
          {dict.register.login}
        </Link>
      </p>
    </div>
  );
}
