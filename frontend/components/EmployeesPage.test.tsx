import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { Employee } from "@/lib/types";
import { EmployeesPage } from "./EmployeesPage";

// Mock the network functions but keep the real error classes (ApiError, ValidationError).
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  listEmployees: vi.fn(),
  getFilterOptions: vi.fn(),
  deactivateEmployee: vi.fn(),
}));

// The form has its own tests; here a stub lets us check how the page opens, saves and closes it.
vi.mock("./EmployeeForm", () => ({
  EmployeeForm: ({ opened, employee, onSaved }: { opened: boolean; employee?: { id: number; full_name: string }; onSaved: (e: unknown) => void }) =>
    opened ? (
      <div role="dialog" aria-label="Employee form">
        {employee ? `Editing ${employee.full_name}` : "Adding a new employee"}
        <button onClick={() => onSaved({ id: 99 })}>Stub save</button>
      </div>
    ) : null,
}));

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

  it("shows the problem and lets the user retry when the API call fails", async () => {
    vi.mocked(api.listEmployees)
      .mockRejectedValueOnce(new ApiError(0, "Could not reach the server. Is the API running?"))
      .mockResolvedValueOnce(page([asha]));
    renderWithProviders(<EmployeesPage />);

    expect(await screen.findByText("Could not reach the server. Is the API running?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Asha Rao")).toBeInTheDocument();
    expect(screen.queryByText(/Could not reach/)).not.toBeInTheDocument();
  });

  it("searches by name or email after the user pauses typing, not on every keystroke", async () => {
    renderWithProviders(<EmployeesPage />);
    await screen.findByText("Asha Rao");
    vi.mocked(api.listEmployees).mockClear();

    await userEvent.type(screen.getByRole("textbox", { name: "Search" }), "sharma");

    await waitFor(() => expect(api.listEmployees).toHaveBeenLastCalledWith(expect.objectContaining({ q: "sharma" })));
    const queries = vi.mocked(api.listEmployees).mock.calls.map(([params]) => params?.q);
    expect(queries).not.toContain("s"); // intermediate keystrokes were debounced away
  });

  it("filters by country, department, seniority and status using options from the API", async () => {
    renderWithProviders(<EmployeesPage />);
    await screen.findByText("Asha Rao");

    await userEvent.selectOptions(await screen.findByLabelText("Country"), "Japan");
    await waitFor(() => expect(api.listEmployees).toHaveBeenLastCalledWith(expect.objectContaining({ country: "Japan" })));

    await userEvent.selectOptions(screen.getByLabelText("Department"), "Sales");
    await userEvent.selectOptions(screen.getByLabelText("Seniority"), "senior");
    await userEvent.selectOptions(screen.getByLabelText("Status"), "all");
    await waitFor(() =>
      expect(api.listEmployees).toHaveBeenLastCalledWith(
        expect.objectContaining({ country: "Japan", department: "Sales", seniority: "senior", status: "all" }),
      ),
    );
  });

  it("starts on active employees only", async () => {
    renderWithProviders(<EmployeesPage />);
    await screen.findByText("Asha Rao");
    expect(screen.getByLabelText("Status")).toHaveValue("active");
    expect(api.listEmployees).toHaveBeenCalledWith(expect.objectContaining({ status: "active" }));
  });

  describe("paging", () => {
    const sixtyEmployees = () => ({ data: [asha], meta: { page: 1, per_page: 25, total: 60, total_pages: 3 } });

    it("shows the total and moves between pages", async () => {
      vi.mocked(api.listEmployees).mockResolvedValue(sixtyEmployees());
      renderWithProviders(<EmployeesPage />);

      expect(await screen.findByText("60 employees")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "2" }));
      await waitFor(() => expect(api.listEmployees).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));
    });

    it("returns to page 1 when a filter changes", async () => {
      vi.mocked(api.listEmployees).mockResolvedValue(sixtyEmployees());
      renderWithProviders(<EmployeesPage />);
      await screen.findByText("60 employees");
      await userEvent.click(screen.getByRole("button", { name: "3" }));
      await waitFor(() => expect(api.listEmployees).toHaveBeenLastCalledWith(expect.objectContaining({ page: 3 })));

      await userEvent.selectOptions(await screen.findByLabelText("Country"), "India");
      await waitFor(() =>
        expect(api.listEmployees).toHaveBeenLastCalledWith(expect.objectContaining({ country: "India", page: 1 })),
      );
    });

    it("hides the pager when everything fits on one page", async () => {
      renderWithProviders(<EmployeesPage />);
      expect(await screen.findByText("1 employee")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "2" })).not.toBeInTheDocument();
    });
  });

  describe("sorting", () => {
    it("sorts by a column on click and flips direction on the second click", async () => {
      renderWithProviders(<EmployeesPage />);
      await screen.findByText("Asha Rao");

      await userEvent.click(screen.getByRole("button", { name: "Name" }));
      await waitFor(() => expect(api.listEmployees).toHaveBeenLastCalledWith(expect.objectContaining({ sort: "full_name", dir: "asc" })));

      await userEvent.click(screen.getByRole("button", { name: "Name" }));
      await waitFor(() => expect(api.listEmployees).toHaveBeenLastCalledWith(expect.objectContaining({ sort: "full_name", dir: "desc" })));
      expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "descending");
    });

    it("only offers salary sorting within one country, because currencies are not comparable", async () => {
      renderWithProviders(<EmployeesPage />);
      await screen.findByText("Asha Rao");
      expect(screen.queryByRole("button", { name: "Salary" })).not.toBeInTheDocument();

      await userEvent.selectOptions(await screen.findByLabelText("Country"), "India");
      await userEvent.click(await screen.findByRole("button", { name: "Salary" }));
      await waitFor(() => expect(api.listEmployees).toHaveBeenLastCalledWith(expect.objectContaining({ sort: "annual_salary", country: "India" })));
    });
  });

  it("shows department, country, seniority and flags people who have left", async () => {
    vi.mocked(api.listEmployees).mockResolvedValue(page([asha, { ...asha, id: 2, full_name: "Left Co", email: "l@acme.test", active: false }]));
    renderWithProviders(<EmployeesPage />);
    await screen.findByText("Left Co");
    const table = within(screen.getByRole("table"));
    expect(table.getAllByText("Engineering")).toHaveLength(2);
    expect(table.getAllByText("India")).toHaveLength(2);
    expect(table.getAllByText("mid")).toHaveLength(2);
    expect(table.getByText("Inactive")).toBeInTheDocument();
  });

  describe("adding", () => {
    it("opens the form from the Add employee button and refreshes the list after saving", async () => {
      renderWithProviders(<EmployeesPage />);
      await screen.findByText("Asha Rao");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Add employee" }));
      expect(screen.getByRole("dialog")).toHaveTextContent("Adding a new employee");

      vi.mocked(api.listEmployees).mockClear();
      await userEvent.click(screen.getByRole("button", { name: "Stub save" }));

      await waitFor(() => expect(api.listEmployees).toHaveBeenCalled());
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(await screen.findByText("Employee saved")).toBeInTheDocument();
    });
  });

  describe("editing", () => {
    it("opens the form for the chosen row", async () => {
      renderWithProviders(<EmployeesPage />);
      await screen.findByText("Asha Rao");
      await userEvent.click(screen.getByRole("button", { name: "Edit Asha Rao" }));
      expect(screen.getByRole("dialog")).toHaveTextContent("Editing Asha Rao");
    });
  });
});
