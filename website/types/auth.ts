export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_email_verified: boolean;
  created_at: string;
}

export interface Address {
  id: string;
  label: string;
  full_name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
  phone: string;
  is_default: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  gdpr_consent: boolean;
}
