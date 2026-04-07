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
} as const;
