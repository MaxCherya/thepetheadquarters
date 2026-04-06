import type { PaginatedResponse, SuccessResponse } from "@/types/api";

class ApiClient {
  private defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  async get<T>(url: string, params?: Record<string, string>): Promise<T> {
    const searchParams = new URLSearchParams(params);
    const fullUrl = params ? `${url}?${searchParams.toString()}` : url;

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: this.defaultHeaders,
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new ApiError(response.status, `API request failed: ${response.statusText}`);
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
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const apiClient = new ApiClient();
