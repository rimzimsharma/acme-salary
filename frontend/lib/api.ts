import { buildQuery } from "./query";
import type { Employee, EmployeeSearchParams, PageMeta } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, { headers: { Accept: "application/json" } });
  return response.json();
}

export function listEmployees(params: EmployeeSearchParams = {}) {
  return request<{ data: Employee[]; meta: PageMeta }>(`/api/v1/employees${buildQuery({ ...params })}`);
}
