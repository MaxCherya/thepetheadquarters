"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@heroui/react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/validations/auth";
import type enAuth from "@/i18n/dictionaries/en/auth.json";

interface PasswordFormProps {
  dict: typeof enAuth;
}

export function PasswordForm({ dict }: PasswordFormProps) {
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const errorMessages: Record<string, string> = {
    "auth.current_password_required": dict.errors.current_password_required,
    "auth.password_min_length": dict.errors.password_min_length,
    "auth.confirm_password_required": dict.errors.confirm_password_required,
    "auth.passwords_mismatch": dict.errors.passwords_mismatch,
  };

  async function onSubmit(data: ChangePasswordFormData) {
    setServerError("");
    try {
      await apiClient.post(endpoints.auth.passwordChange, {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success(dict.changePassword.success);
      reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("wrong_password")) {
        setServerError(dict.changePassword.wrongPassword);
      } else {
        setServerError("Something went wrong.");
      }
    }
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
        {serverError && (
          <p className="rounded-md text-center" style={{ background: "rgba(198,40,40,0.08)", border: "1px solid rgba(198,40,40,0.2)", color: "var(--error)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", padding: "var(--space-3)" }}>
            {serverError}
          </p>
        )}

        <div>
          <label style={labelStyle}>{dict.changePassword.currentPassword}</label>
          <input {...register("current_password")} type="password" autoComplete="current-password" className="w-full outline-none" style={inputStyle(!!errors.current_password)} />
          {errors.current_password && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--error)", marginTop: "var(--space-1)" }}>{errorMessages[errors.current_password.message ?? ""] ?? errors.current_password.message}</p>}
        </div>

        <div>
          <label style={labelStyle}>{dict.changePassword.newPassword}</label>
          <input {...register("new_password")} type="password" autoComplete="new-password" className="w-full outline-none" style={inputStyle(!!errors.new_password)} />
          {errors.new_password && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--error)", marginTop: "var(--space-1)" }}>{errorMessages[errors.new_password.message ?? ""] ?? errors.new_password.message}</p>}
        </div>

        <div>
          <label style={labelStyle}>{dict.changePassword.confirmPassword}</label>
          <input {...register("confirm_password")} type="password" autoComplete="new-password" className="w-full outline-none" style={inputStyle(!!errors.confirm_password)} />
          {errors.confirm_password && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--error)", marginTop: "var(--space-1)" }}>{errorMessages[errors.confirm_password.message ?? ""] ?? errors.confirm_password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-gold self-start rounded-md px-8 py-3 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
          style={{ fontFamily: "var(--font-montserrat)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", letterSpacing: "var(--tracking-wider)", textTransform: "uppercase" }}
        >
          {isSubmitting ? "..." : dict.changePassword.submit}
        </button>
      </form>
    </div>
  );
}
