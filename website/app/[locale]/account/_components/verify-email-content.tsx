"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "@heroui/react";
import { CheckCircle, AlertCircle, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { endpoints } from "@/config/endpoints";
import type enAuth from "@/i18n/dictionaries/en/auth.json";

interface VerifyEmailContentProps {
  dict: typeof enAuth;
  token?: string;
}

export function VerifyEmailContent({ dict, token }: VerifyEmailContentProps) {
  const { refreshUser, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<"pending" | "verifying" | "verified" | "error">(
    token ? "verifying" : "pending",
  );
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(endpoints.auth.verifyEmail, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setStatus("verified");
          refreshUser();
        } else if (data.code?.includes("expired")) {
          setStatus("error");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [token, refreshUser]);

  async function handleResend() {
    setResending(true);
    try {
      await fetch(endpoints.auth.resendVerification, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      toast.success(dict.verifyEmail.resent);
    } catch {
      toast.danger("Something went wrong.");
    } finally {
      setResending(false);
    }
  }

  if (status === "verifying") {
    return (
      <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-base)", color: "var(--white-dim)" }}>
        Verifying...
      </p>
    );
  }

  if (status === "verified") {
    return (
      <>
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(46,125,50,0.1)", border: "1px solid rgba(46,125,50,0.2)" }}>
          <CheckCircle size={28} style={{ color: "var(--success)" }} />
        </div>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)", marginBottom: "var(--space-3)" }}>
          {dict.verifyEmail.verified}
        </h1>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)", marginBottom: "var(--space-8)" }}>
          {dict.verifyEmail.verifiedDescription}
        </p>
        <Link
          href="/products"
          className="btn-gold inline-block rounded-md px-8 py-3 transition-all duration-300 hover:-translate-y-0.5"
          style={{ fontFamily: "var(--font-montserrat)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", letterSpacing: "var(--tracking-wider)", textTransform: "uppercase" }}
        >
          {dict.verifyEmail.continueShipping}
        </Link>
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(198,40,40,0.1)", border: "1px solid rgba(198,40,40,0.2)" }}>
          <AlertCircle size={28} style={{ color: "var(--error)" }} />
        </div>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)", marginBottom: "var(--space-3)" }}>
          {dict.verifyEmail.expired}
        </h1>
        {isAuthenticated && (
          <button
            onClick={handleResend}
            disabled={resending}
            className="btn-gold mt-4 inline-block rounded-md px-8 py-3 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
            style={{ fontFamily: "var(--font-montserrat)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", letterSpacing: "var(--tracking-wider)", textTransform: "uppercase" }}
          >
            {dict.verifyEmail.resend}
          </button>
        )}
      </>
    );
  }

  // Pending — user just registered
  return (
    <>
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(187,148,41,0.1)", border: "1px solid rgba(187,148,41,0.2)" }}>
        <Mail size={28} style={{ color: "var(--gold)" }} />
      </div>
      <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)", marginBottom: "var(--space-3)" }}>
        {dict.verifyEmail.title}
      </h1>
      <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)", marginBottom: "var(--space-6)" }}>
        {dict.verifyEmail.description}
      </p>
      {isAuthenticated && (
        <button
          onClick={handleResend}
          disabled={resending}
          className="transition-colors duration-200 hover:text-[var(--gold)]"
          style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--gold-dark)", fontWeight: "var(--weight-medium)" }}
        >
          {resending ? "..." : dict.verifyEmail.resend}
        </button>
      )}
    </>
  );
}
