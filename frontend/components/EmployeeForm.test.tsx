import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "@/lib/api";
import { ValidationError } from "@/lib/api";
import type { Employee } from "@/lib/types";
import { renderWithProviders } from "@/test-utils";
import { EmployeeForm } from "./EmployeeForm";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
}));

const saved: Employee = {
  id: 9, full_name: "Asha Rao", email: "asha@acme.test", job_title: "Engineer", department: "Engineering",
  country: "India", currency: "INR", annual_salary: 2400000, annual_salary_usd: 28916, seniority: "mid",
  hire_date: "2022-03-01", active: true,
};

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText(/Full name/), "Asha Rao");
  await userEvent.type(screen.getByLabelText(/Email/), "asha@acme.test");
  await userEvent.type(screen.getByLabelText(/Job title/), "Engineer");
  await userEvent.type(screen.getByLabelText(/Department/), "Engineering");
  await userEvent.type(screen.getByLabelText(/Country/), "India");
  await userEvent.selectOptions(screen.getByLabelText(/Currency/), "INR");
  await userEvent.type(screen.getByLabelText(/Annual salary/), "2400000");
  await userEvent.selectOptions(screen.getByLabelText(/Seniority/), "mid");
  await userEvent.type(screen.getByLabelText(/Hire date/), "2022-03-01");
}

const open = (props: Partial<React.ComponentProps<typeof EmployeeForm>> = {}) => {
  const onSaved = vi.fn();
  const onClose = vi.fn();
  renderWithProviders(<EmployeeForm opened onClose={onClose} onSaved={onSaved} {...props} />);
  return { onSaved, onClose };
};

beforeEach(() => {
  vi.mocked(api.createEmployee).mockResolvedValue(saved);
  vi.mocked(api.updateEmployee).mockResolvedValue(saved);
});

describe("EmployeeForm (add)", () => {
  it("creates an employee from the entered details and reports success", async () => {
    const { onSaved } = open();
    expect(screen.getByRole("heading", { name: "Add employee" })).toBeInTheDocument();

    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(api.createEmployee).toHaveBeenCalledTimes(1));
    expect(api.createEmployee).toHaveBeenCalledWith({
      full_name: "Asha Rao", email: "asha@acme.test", job_title: "Engineer", department: "Engineering",
      country: "India", currency: "INR", annual_salary: 2400000, seniority: "mid", hire_date: "2022-03-01",
    });
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
  });
});

describe("EmployeeForm validation", () => {
  it("blocks saving and marks every missing required field", async () => {
    open();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findAllByText("Required")).toHaveLength(7);
    expect(api.createEmployee).not.toHaveBeenCalled();
  });

  it("rejects a malformed email and a hire date in the future before calling the API", async () => {
    open();
    await fillValidForm();
    await userEvent.clear(screen.getByLabelText(/Email/));
    await userEvent.type(screen.getByLabelText(/Email/), "not-an-email");
    await userEvent.clear(screen.getByLabelText(/Hire date/));
    await userEvent.type(screen.getByLabelText(/Hire date/), "2999-01-01");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Hire date cannot be in the future")).toBeInTheDocument();
    expect(api.createEmployee).not.toHaveBeenCalled();
  });
});

describe("EmployeeForm server errors", () => {
  it("shows the server's field messages and keeps the form open for correction", async () => {
    vi.mocked(api.createEmployee).mockRejectedValue(new ValidationError({ email: ["has already been taken"] }));
    const { onSaved, onClose } = open();
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("has already been taken")).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Full name/)).toHaveValue("Asha Rao"); // nothing the user typed is lost
  });

  it("explains non-validation failures such as a down server", async () => {
    vi.mocked(api.createEmployee).mockRejectedValue(new api.ApiError(0, "Could not reach the server. Is the API running?"));
    open();
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Could not reach the server. Is the API running?")).toBeInTheDocument();
  });
});
