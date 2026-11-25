import { buildQuery } from "./query";
import type { Employee, EmployeeInput, EmployeeSearchParams, PageMeta } from "./types";

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

/** The API rejected the data (HTTP 422); `errors` maps each field to its messages. */
export class ValidationError extends ApiError {
  constructor(readonly errors: Record<string, string[]>) {
    super(422, "Some fields need attention");
    this.name = "ValidationError";
  }
}

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, "Could not reach the server. Is the API running?");
  }
  const body = await response.json().catch(() => ({}));
  if (response.status === 422 && body.errors) throw new ValidationError(body.errors);
  if (!response.ok) throw new ApiError(response.status, body.error ?? `Request failed (${response.status})`);
  return body;
}

export function listEmployees(params: EmployeeSearchParams = {}) {
  return request<{ data: Employee[]; meta: PageMeta }>(`/api/v1/employees${buildQuery({ ...params })}`);
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  return (await request<{ data: Employee }>("/api/v1/employees", { method: "POST", body: { employee: input } })).data;
}
