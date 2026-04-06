"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@heroui/react";
import { endpoints } from "@/config/endpoints";

const schema = z.object({
  email: z
    .string()
    .min(1, "newsletter.email_required")
    .email("newsletter.email_invalid")
    .max(254, "newsletter.email_too_long"),
});

type FormData = z.infer<typeof schema>;

interface NewsletterSectionProps {
  dict: {
    label: string;
    title: string;
    subtitle: string;
    placeholder: string;
    cta: string;
    success: string;
    alreadySubscribed: string;
    error: string;
    emailRequired: string;
    emailInvalid: string;
  };
}

export function NewsletterSection({ dict }: NewsletterSectionProps) {
  const formLoadedAt = useRef(Date.now());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const errorMessages: Record<string, string> = {
    "newsletter.email_required": dict.emailRequired,
    "newsletter.email_invalid": dict.emailInvalid,
  };

  async function onSubmit(data: FormData, e?: React.BaseSyntheticEvent) {
    const form = e?.target as HTMLFormElement | undefined;
    const honeypot = form
      ? (form.elements.namedItem("website") as HTMLInputElement)?.value
      : "";
    if (honeypot) return;

    const elapsed = Date.now() - formLoadedAt.current;
    if (elapsed < 2000) {
      toast.warning(dict.error);
      return;
    }

    try {
      const response = await fetch(endpoints.newsletter.subscribe, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(dict.success);
        reset();
        formLoadedAt.current = Date.now();
      } else if (result.code === "newsletter.already_subscribed") {
        toast.warning(dict.alreadySubscribed);
      } else {
        toast.danger(dict.error);
      }
    } catch {
      toast.danger(dict.error);
    }
  }

  return (
    <section className="py-16 md:py-24" style={{ background: "var(--bg-secondary)" }}>
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <span
          className="mb-4 block"
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-xs)",
            letterSpacing: "var(--tracking-widest)",
            textTransform: "uppercase",
            color: "var(--gold)",
          }}
        >
          {dict.label}
        </span>
        <h2
          className="mb-4"
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
            fontWeight: "var(--weight-light)",
            color: "var(--white)",
            letterSpacing: "var(--tracking-tight)",
          }}
        >
          {dict.title}
        </h2>
        <p
          className="mb-8"
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-base)",
            color: "var(--white-dim)",
          }}
        >
          {dict.subtitle}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Honeypot */}
            <input
              type="text"
              name="website"
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", opacity: 0 }}
            />

            <input
              {...register("email")}
              type="text"
              placeholder={dict.placeholder}
              disabled={isSubmitting}
              className="flex-1 outline-none transition-colors duration-300 focus:border-[var(--gold)]"
              style={{
                background: "var(--bg-tertiary)",
                border: `1px solid ${errors.email ? "var(--error)" : "var(--bg-border)"}`,
                color: "var(--white)",
                fontFamily: "var(--font-montserrat)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-3) var(--space-4)",
                opacity: isSubmitting ? 0.6 : 1,
              }}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-invert shrink-0 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "var(--gold)",
                color: "var(--black)",
                fontFamily: "var(--font-montserrat)",
                fontWeight: "var(--weight-semibold)",
                fontSize: "var(--text-sm)",
                letterSpacing: "var(--tracking-wider)",
                textTransform: "uppercase",
                padding: "var(--space-3) var(--space-6)",
                borderRadius: "var(--radius-md)",
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              {dict.cta}
            </button>
          </div>

          {errors.email && (
            <p
              style={{
                fontFamily: "var(--font-montserrat)",
                fontSize: "var(--text-sm)",
                color: "var(--error)",
                textAlign: "left",
              }}
            >
              {errorMessages[errors.email.message ?? ""] ?? errors.email.message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
