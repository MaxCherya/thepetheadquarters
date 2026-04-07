"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@heroui/react";
import { endpoints } from "@/config/endpoints";

const schema = z.object({
  name: z.string().min(1, "nameRequired"),
  email: z.string().min(1, "emailRequired").email("emailInvalid"),
  subject: z.string().optional(),
  message: z.string().min(1, "messageRequired"),
});

type FormData = z.infer<typeof schema>;

interface ContactFormProps {
  dict: {
    name: string;
    email: string;
    subject: string;
    message: string;
    send: string;
    success: string;
    error: string;
    nameRequired: string;
    emailRequired: string;
    emailInvalid: string;
    messageRequired: string;
  };
}

export function ContactForm({ dict }: ContactFormProps) {
  const formLoadedAt = useRef(Date.now());
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const errorMessages: Record<string, string> = {
    nameRequired: dict.nameRequired,
    emailRequired: dict.emailRequired,
    emailInvalid: dict.emailInvalid,
    messageRequired: dict.messageRequired,
  };

  async function onSubmit(data: FormData, e?: React.BaseSyntheticEvent) {
    const form = e?.target as HTMLFormElement | undefined;
    const honeypot = form ? (form.elements.namedItem("website") as HTMLInputElement)?.value : "";
    if (honeypot) return;

    if (Date.now() - formLoadedAt.current < 3000) {
      toast.warning(dict.error);
      return;
    }

    try {
      const response = await fetch(endpoints.contact.send, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(dict.success);
        reset();
        formLoadedAt.current = Date.now();
      } else {
        toast.danger(dict.error);
      }
    } catch {
      toast.danger(dict.error);
    }
  }

  const inputStyle = {
    width: "100%",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--bg-border)",
    color: "var(--white)",
    fontFamily: "var(--font-montserrat)",
    fontSize: "var(--text-sm)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-3) var(--space-4)",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", opacity: 0 }}
      />

      <div>
        <input {...register("name")} type="text" placeholder={dict.name} disabled={isSubmitting} style={inputStyle} className="outline-none" />
        {errors.name && <p className="mt-1" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--error)" }}>{errorMessages[errors.name.message ?? ""]}</p>}
      </div>

      <div>
        <input {...register("email")} type="text" placeholder={dict.email} disabled={isSubmitting} style={inputStyle} className="outline-none" />
        {errors.email && <p className="mt-1" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--error)" }}>{errorMessages[errors.email.message ?? ""]}</p>}
      </div>

      <input {...register("subject")} type="text" placeholder={dict.subject} disabled={isSubmitting} style={inputStyle} className="outline-none" />

      <div>
        <textarea {...register("message")} placeholder={dict.message} rows={6} disabled={isSubmitting} style={inputStyle} className="resize-none outline-none" />
        {errors.message && <p className="mt-1" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--error)" }}>{errorMessages[errors.message.message ?? ""]}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(201,168,76,0.4)] disabled:opacity-50"
        style={{
          background: "var(--gold)",
          color: "var(--black)",
          fontFamily: "var(--font-montserrat)",
          fontWeight: "var(--weight-semibold)",
          fontSize: "var(--text-sm)",
          letterSpacing: "var(--tracking-wider)",
          textTransform: "uppercase",
          padding: "var(--space-3) var(--space-8)",
          borderRadius: "var(--radius-md)",
        }}
      >
        {dict.send}
      </button>
    </form>
  );
}
