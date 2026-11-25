import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import type { Employee } from "@/lib/types";
import { EmployeesPage } from "./EmployeesPage";

vi.mock("@/lib/api");

const asha: Employee = {
  id: 1, full_name: "Asha Rao", email: "asha@acme.test", job_title: "Software Engineer", department: "Engineering",
  country: "India", currency: "INR", annual_salary: 2400000, annual_salary_usd: 28916, seniority: "mid",
  hire_date: "2022-03-01", active: true,
};

const page = (data: Employee[], total = data.length) => ({
  data, meta: { page: 1, per_page: 25, total, total_pages: Math.max(1, Math.ceil(total / 25)) },
});

beforeEach(() => {
  vi.mocked(api.listEmployees).mockResolvedValue(page([asha]));
  vi.mocked(api.getFilterOptions).mockResolvedValue({
    countries: ["India", "Japan"], departments: ["Engineering", "Sales"], job_titles: ["Software Engineer"],
    seniorities: ["junior", "mid", "senior", "lead", "executive"], currencies: ["INR", "JPY", "USD"],
  });
});

describe("EmployeesPage", () => {
  it("lists employees with salary in local currency and in USD", async () => {
    renderWithProviders(<EmployeesPage />);
    expect(await screen.findByText("Asha Rao")).toBeInTheDocument();
    expect(screen.getByText("asha@acme.test")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("₹2,400,000")).toBeInTheDocument();
    expect(screen.getByText("$28,916")).toBeInTheDocument();
  });

  it("shows a loading message until the first response arrives", async () => {
    vi.mocked(api.listEmployees).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<EmployeesPage />);
    expect(await screen.findByText("Loading employees…")).toBeInTheDocument();
  });

  it("explains when nothing matches instead of showing an empty table", async () => {
    vi.mocked(api.listEmployees).mockResolvedValue(page([]));
    renderWithProviders(<EmployeesPage />);
    expect(await screen.findByText("No employees match your filters.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
