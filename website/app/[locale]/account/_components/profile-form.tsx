"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@heroui/react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { User } from "@/types/auth";
import type enAuth from "@/i18n/dictionaries/en/auth.json";

interface ProfileFormProps {
  dict: typeof enAuth;
}

interface ProfileData {
  first_name: string;
  last_name: string;
  phone: string;
}

export function ProfileForm({ dict }: ProfileFormProps) {
  const { user, updateUser } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<ProfileData>();

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
      });
    }
  }, [user, reset]);

  async function onSubmit(data: ProfileData) {
    try {
      const res = await apiClient.patch<{ status: string; data: User }>(
        endpoints.auth.me,
        data,
      );
      updateUser(res.data);
      reset(data);
      toast.success(dict.profile.saved);
    } catch {
      toast.danger("Something went wrong.");
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

  const inputStyle = {
    background: "var(--bg-tertiary)",
    border: "1px solid var(--bg-border)",
    color: "var(--white)",
    fontFamily: "var(--font-montserrat)",
    fontSize: "var(--text-sm)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-3) var(--space-4)",
  };

  return (
    <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-8)" }}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div>
          <label style={labelStyle}>{dict.profile.email}</label>
          <input
            value={user?.email ?? ""}
            readOnly
            className="w-full outline-none"
            style={{ ...inputStyle, opacity: 0.6 }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>{dict.profile.firstName}</label>
            <input {...register("first_name")} className="w-full outline-none" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{dict.profile.lastName}</label>
            <input {...register("last_name")} className="w-full outline-none" style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>{dict.profile.phone}</label>
          <input {...register("phone")} type="tel" className="w-full outline-none" style={inputStyle} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="btn-gold self-start rounded-md px-8 py-3 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
          style={{ fontFamily: "var(--font-montserrat)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", letterSpacing: "var(--tracking-wider)", textTransform: "uppercase" }}
        >
          {isSubmitting ? "..." : dict.profile.save}
        </button>
      </form>
    </div>
  );
}
