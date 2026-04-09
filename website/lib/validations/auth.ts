import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "auth.email_required").email("auth.email_invalid"),
  password: z.string().min(1, "auth.password_required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    first_name: z.string().min(1, "auth.first_name_required").max(150),
    last_name: z.string().min(1, "auth.last_name_required").max(150),
    email: z.string().min(1, "auth.email_required").email("auth.email_invalid").max(254),
    password: z.string().min(8, "auth.password_min_length"),
    confirm_password: z.string().min(1, "auth.confirm_password_required"),
    gdpr_consent: z.literal(true, { error: "auth.gdpr_required" }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "auth.passwords_mismatch",
    path: ["confirm_password"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "auth.email_required").email("auth.email_invalid"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    new_password: z.string().min(8, "auth.password_min_length"),
    confirm_password: z.string().min(1, "auth.confirm_password_required"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "auth.passwords_mismatch",
    path: ["confirm_password"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "auth.current_password_required"),
    new_password: z.string().min(8, "auth.password_min_length"),
    confirm_password: z.string().min(1, "auth.confirm_password_required"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "auth.passwords_mismatch",
    path: ["confirm_password"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const addressSchema = z.object({
  label: z.string().max(50),
  full_name: z.string().min(1, "auth.full_name_required").max(255),
  address_line_1: z.string().min(1, "auth.address_required").max(255),
  address_line_2: z.string().max(255),
  city: z.string().min(1, "auth.city_required").max(100),
  county: z.string().max(100),
  postcode: z.string().min(1, "auth.postcode_required").max(10),
  country: z.string().length(2),
  phone: z.string().max(20),
  is_default: z.boolean(),
});

export type AddressFormData = z.infer<typeof addressSchema>;
