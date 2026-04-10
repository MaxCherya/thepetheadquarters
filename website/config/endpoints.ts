const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const endpoints = {
  categories: {
    list: `${API_BASE}/categories/`,
    tree: `${API_BASE}/categories/tree/`,
    detail: (slug: string) => `${API_BASE}/categories/${slug}/`,
  },
  brands: {
    list: `${API_BASE}/brands/`,
    detail: (slug: string) => `${API_BASE}/brands/${slug}/`,
  },
  products: {
    list: `${API_BASE}/products/`,
    featured: `${API_BASE}/products/featured/`,
    detail: (slug: string) => `${API_BASE}/products/${slug}/`,
  },
  attributes: {
    list: `${API_BASE}/attributes/`,
    byProduct: (productId: string) => `${API_BASE}/attributes/product/${productId}/`,
  },
  newsletter: {
    subscribe: `${API_BASE}/newsletter/subscribe/`,
  },
  contact: {
    send: `${API_BASE}/contact/`,
  },
  auth: {
    register: `${API_BASE}/auth/register/`,
    login: `${API_BASE}/auth/login/`,
    logout: `${API_BASE}/auth/logout/`,
    refresh: `${API_BASE}/auth/token/refresh/`,
    verifyEmail: `${API_BASE}/auth/verify-email/`,
    resendVerification: `${API_BASE}/auth/verify-email/resend/`,
    passwordReset: `${API_BASE}/auth/password/reset/`,
    passwordResetConfirm: `${API_BASE}/auth/password/reset/confirm/`,
    passwordChange: `${API_BASE}/auth/password/change/`,
    me: `${API_BASE}/auth/me/`,
    deleteAccount: `${API_BASE}/auth/me/delete/`,
  },
  addresses: {
    list: `${API_BASE}/addresses/`,
    detail: (id: string) => `${API_BASE}/addresses/${id}/`,
  },
  orders: {
    checkout: `${API_BASE}/orders/checkout/`,
    list: `${API_BASE}/orders/`,
    detail: (orderNumber: string) => `${API_BASE}/orders/${orderNumber}/`,
    bySession: (sessionId: string) => `${API_BASE}/orders/by-session/${sessionId}/`,
  },
} as const;
