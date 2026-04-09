"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations/auth";
import type enAuth from "@/i18n/dictionaries/en/auth.json";

interface ResetPasswordFormProps {
  dict: typeof enAuth;
  token: string;
}

export function ResetPasswordForm({ dict, token }: ResetPasswordFormProps) {
  const [status, setStatus] = useState<"form" | "success" | "error">("form");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const errorMessages: Record<string, string> = {
    "auth.password_min_length": dict.errors.password_min_length,
    "auth.confirm_password_required": dict.errors.confirm_password_required,
    "auth.passwords_mismatch": dict.errors.passwords_mismatch,
  };

  async function onSubmit(data: ResetPasswordFormData) {
    setServerError("");
    try {
      const res = await apiClient.post<{ status: string; code?: string }>(
        endpoints.auth.passwordResetConfirm,
        { token, new_password: data.new_password },
      );
      if (res.status === "success") {
        setStatus("success");
      } else if (res.code?.includes("expired")) {
        setStatus("error");
      } else {
        setServerError(dict.resetPassword.invalid);
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-8)" }}>
        <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-2xl)", fontWeight: "var(--weight-regular)", color: "var(--white)", marginBottom: "var(--space-3)" }}>
          {dict.resetPassword.success}
        </h2>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)", marginBottom: "var(--space-6)" }}>
          {dict.resetPassword.successDescription}
        </p>
        <Link
          href="/account/login"
          className="btn-gold inline-block rounded-md px-8 py-3 transition-all duration-300 hover:-translate-y-0.5"
          style={{ fontFamily: "var(--font-montserrat)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", letterSpacing: "var(--tracking-wider)", textTransform: "uppercase" }}
        >
          {dict.register.login}
        </Link>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-lg text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-8)" }}>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--error)", marginBottom: "var(--space-6)" }}>
          {dict.resetPassword.expired}
        </p>
        <Link href="/account/forgot-password" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--gold-dark)", fontWeight: "var(--weight-medium)" }}>
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-8)" }}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {serverError && (
          <p className="rounded-md text-center" style={{ background: "rgba(198,40,40,0.08)", border: "1px solid rgba(198,40,40,0.2)", color: "var(--error)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", padding: "var(--space-3)" }}>
            {serverError}
          </p>
        )}

        <div>
          <label style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)", color: "var(--white-dim)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", display: "block", marginBottom: "var(--space-2)" }}>
            {dict.resetPassword.password}
          </label>
          <input
            {...register("new_password")}
            type="password"
            autoComplete="new-password"
            className="w-full outline-none"
            style={{ background: "var(--bg-tertiary)", border: `1px solid ${errors.new_password ? "var(--error)" : "var(--bg-border)"}`, color: "var(--white)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)" }}
          />
          {errors.new_password && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--error)", marginTop: "var(--space-1)" }}>{errorMessages[errors.new_password.message ?? ""] ?? errors.new_password.message}</p>}
        </div>

        <div>
          <label style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)", color: "var(--white-dim)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", display: "block", marginBottom: "var(--space-2)" }}>
            {dict.resetPassword.confirmPassword}
          </label>
          <input
            {...register("confirm_password")}
            type="password"
            autoComplete="new-password"
            className="w-full outline-none"
            style={{ background: "var(--bg-tertiary)", border: `1px solid ${errors.confirm_password ? "var(--error)" : "var(--bg-border)"}`, color: "var(--white)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)" }}
          />
          {errors.confirm_password && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--error)", marginTop: "var(--space-1)" }}>{errorMessages[errors.confirm_password.message ?? ""] ?? errors.confirm_password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-gold w-full rounded-md py-3 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
          style={{ fontFamily: "var(--font-montserrat)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", letterSpacing: "var(--tracking-wider)", textTransform: "uppercase" }}
        >
          {isSubmitting ? "..." : dict.resetPassword.submit}
        </button>
      </form>
    </div>
  );
}
