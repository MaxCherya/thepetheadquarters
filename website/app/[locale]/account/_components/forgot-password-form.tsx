"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/auth";
import type enAuth from "@/i18n/dictionaries/en/auth.json";

interface ForgotPasswordFormProps {
  dict: typeof enAuth;
}

export function ForgotPasswordForm({ dict }: ForgotPasswordFormProps) {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    try {
      await apiClient.post(endpoints.auth.passwordReset, { email: data.email });
    } catch {
      // Always show success to not reveal whether email exists
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div
        className="rounded-lg text-center"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-8)" }}
      >
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)", marginBottom: "var(--space-6)", lineHeight: "var(--leading-relaxed)" }}>
          {dict.forgotPassword.sent}
        </p>
        <Link href="/account/login" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--gold-dark)", fontWeight: "var(--weight-medium)" }}>
          {dict.forgotPassword.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-8)" }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div>
          <label
            style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)", color: "var(--white-dim)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", display: "block", marginBottom: "var(--space-2)" }}
          >
            {dict.forgotPassword.email}
          </label>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            className="w-full outline-none"
            style={{ background: "var(--bg-tertiary)", border: `1px solid ${errors.email ? "var(--error)" : "var(--bg-border)"}`, color: "var(--white)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)" }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-gold w-full rounded-md py-3 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
          style={{ fontFamily: "var(--font-montserrat)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", letterSpacing: "var(--tracking-wider)", textTransform: "uppercase" }}
        >
          {isSubmitting ? "..." : dict.forgotPassword.submit}
        </button>
      </form>

      <p className="mt-6 text-center">
        <Link href="/account/login" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--gold-dark)", fontWeight: "var(--weight-medium)" }}>
          {dict.forgotPassword.backToLogin}
        </Link>
      </p>
    </div>
  );
}
