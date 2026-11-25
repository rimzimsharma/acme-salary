export type Seniority = "junior" | "mid" | "senior" | "lead" | "executive";

export interface Employee {
  id: number;
  full_name: string;
  email: string;
  job_title: string;
  department: string;
  country: string;
  currency: string;
  annual_salary: number;
  annual_salary_usd: number;
  seniority: Seniority;
  hire_date: string;
  active: boolean;
}

export type EmployeeInput = Omit<Employee, "id" | "active" | "annual_salary_usd">;

export interface PageMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface EmployeeSearchParams {
  q?: string;
  status?: "active" | "inactive" | "all";
  country?: string;
  department?: string;
  job_title?: string;
  seniority?: string;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  per_page?: number;
}
