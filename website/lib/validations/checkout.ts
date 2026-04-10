import { z } from "zod";

export const shippingAddressSchema = z.object({
  full_name: z.string().min(1, "checkout.full_name_required").max(255),
  address_line_1: z.string().min(1, "checkout.address_required").max(255),
  address_line_2: z.string().max(255).default(""),
  city: z.string().min(1, "checkout.city_required").max(100),
  county: z.string().max(100).default(""),
  postcode: z.string().min(1, "checkout.postcode_required").max(10),
  country: z.string().length(2).default("GB"),
  phone: z.string().max(20).default(""),
});

export type ShippingAddressData = z.infer<typeof shippingAddressSchema>;

export const guestCheckoutSchema = z.object({
  email: z.string().min(1, "checkout.email_required").email("checkout.email_invalid"),
  shipping_address: shippingAddressSchema,
});

export type GuestCheckoutData = z.infer<typeof guestCheckoutSchema>;
