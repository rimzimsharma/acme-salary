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

export interface FilterOptions {
  countries: string[];
  departments: string[];
  job_titles: string[];
  seniorities: Seniority[];
  currencies: string[];
}

export interface PayFigures {
  min: number | null;
  median: number | null;
  avg: number | null;
  max: number | null;
}

export interface Summary {
  headcount: number;
  inactive_count: number;
  countries: number;
  total_payroll_usd: number;
  usd: PayFigures;
}

export type BreakdownDimension = "country" | "department" | "job_title" | "seniority";

export interface BreakdownGroup {
  key: string;
  headcount: number;
  usd: PayFigures & { total: number };
  local: (PayFigures & { currency: string }) | null;
}

export interface Outlier {
  id: number;
  full_name: string;
  job_title: string;
  country: string;
  seniority: Seniority;
  currency: string;
  annual_salary: number;
  salary_usd: number;
  peer_median_usd: number;
  direction: "above" | "below";
  deviation_pct: number;
}
