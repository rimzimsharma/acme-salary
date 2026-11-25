import { buildQuery } from "./query";
import type { Employee, EmployeeSearchParams, PageMeta } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { headers: { Accept: "application/json" } });
  } catch {
    throw new ApiError(0, "Could not reach the server. Is the API running?");
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, body.error ?? `Request failed (${response.status})`);
  return body;
}

export function listEmployees(params: EmployeeSearchParams = {}) {
  return request<{ data: Employee[]; meta: PageMeta }>(`/api/v1/employees${buildQuery({ ...params })}`);
}
