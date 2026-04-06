export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface SuccessResponse<T> {
  status: "success";
  data: T;
}

export interface ErrorResponse {
  status: "error";
  code: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
