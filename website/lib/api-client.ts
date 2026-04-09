import type { PaginatedResponse, SuccessResponse } from "@/types/api";

function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/auth/token/refresh/`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken(),
      },
    },
  )
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

class ApiClient {
  private baseHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
    };
  }

  private mutationHeaders(): Record<string, string> {
    return {
      ...this.baseHeaders(),
      "X-CSRFToken": getCsrfToken(),
    };
  }

  async get<T>(url: string, params?: Record<string, string>): Promise<T> {
    const searchParams = new URLSearchParams(params);
    const fullUrl = params ? `${url}?${searchParams.toString()}` : url;
    const isClient = typeof window !== "undefined";

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: this.baseHeaders(),
      ...(isClient ? { credentials: "include" as const } : {}),
      ...(isClient ? {} : { next: { revalidate: 60 } }),
    });

    if (!response.ok) {
      throw new ApiError(response.status, `API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    return this.mutate<T>("POST", url, data);
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    return this.mutate<T>("PATCH", url, data);
  }

  async del<T>(url: string, data?: unknown): Promise<T> {
    return this.mutate<T>("DELETE", url, data);
  }

  private async mutate<T>(method: string, url: string, data?: unknown): Promise<T> {
    const response = await fetch(url, {
      method,
      headers: this.mutationHeaders(),
      credentials: "include",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });

    if (response.status === 401) {
      const refreshed = await attemptRefresh();
      if (refreshed) {
        const retry = await fetch(url, {
          method,
          headers: this.mutationHeaders(),
          credentials: "include",
          body: data !== undefined ? JSON.stringify(data) : undefined,
        });
        if (!retry.ok) {
          const err = await retry.json().catch(() => ({}));
          throw new ApiError(retry.status, err.code || `API request failed`, err);
        }
        return retry.json();
      }
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new ApiError(response.status, err.code || `API request failed`, err);
    }

    return response.json();
  }

  async getPaginated<T>(url: string, params?: Record<string, string>): Promise<PaginatedResponse<T>> {
    return this.get<PaginatedResponse<T>>(url, params);
  }

  async getSuccess<T>(url: string, params?: Record<string, string>): Promise<T> {
    const response = await this.get<SuccessResponse<T>>(url, params);
    return response.data;
  }
}

export class ApiError extends Error {
  public body: Record<string, unknown>;

  constructor(
    public status: number,
    message: string,
    body?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.body = body ?? {};
  }
}

export const apiClient = new ApiClient();
