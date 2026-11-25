import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, ValidationError, createEmployee, deactivateEmployee, listEmployees, updateEmployee } from "./api";
import type { EmployeeInput } from "./types";

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("listEmployees", () => {
  it("requests the employees endpoint with only the filters that are set", async () => {
    const body = { data: [{ id: 1 }], meta: { page: 1, per_page: 25, total: 1, total_pages: 1 } };
    const fetchMock = mockFetch(200, body);

    const result = await listEmployees({ country: "India", q: "", page: 2 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/employees?country=India&page=2",
      expect.objectContaining({ headers: expect.objectContaining({ Accept: "application/json" }) }),
    );
    expect(result).toEqual(body);
  });
});

describe("error handling", () => {
  it("throws an ApiError carrying the status and the server's message", async () => {
    mockFetch(404, { error: "Employee not found" });
    await expect(listEmployees()).rejects.toMatchObject({ name: "ApiError", status: 404, message: "Employee not found" });
  });

  it("falls back to a generic message when the body has no error text", async () => {
    mockFetch(500, {});
    await expect(listEmployees()).rejects.toThrow("Request failed (500)");
  });

  it("explains network failures in plain language", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(listEmployees()).rejects.toThrow("Could not reach the server");
    await expect(listEmployees()).rejects.toBeInstanceOf(ApiError);
  });
});

const input: EmployeeInput = {
  full_name: "Asha Rao", email: "asha@acme.test", job_title: "Engineer", department: "Engineering",
  country: "India", currency: "INR", annual_salary: 2400000, seniority: "mid", hire_date: "2022-03-01",
};

describe("createEmployee", () => {
  it("POSTs the employee as JSON and returns the created record", async () => {
    const fetchMock = mockFetch(201, { data: { id: 7, ...input } });
    const created = await createEmployee(input);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3001/api/v1/employees");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ employee: input });
    expect(created.id).toBe(7);
  });

  it("surfaces per-field validation errors from a 422", async () => {
    mockFetch(422, { errors: { email: ["is invalid"], annual_salary: ["must be greater than 0"] } });
    const failure = await createEmployee(input).catch((e) => e);
    expect(failure).toBeInstanceOf(ValidationError);
    expect(failure.errors).toEqual({ email: ["is invalid"], annual_salary: ["must be greater than 0"] });
  });
});

describe("updateEmployee and deactivateEmployee", () => {
  it("PATCHes only the changed fields to the employee's URL", async () => {
    const fetchMock = mockFetch(200, { data: { id: 7, annual_salary: 2500000 } });
    const updated = await updateEmployee(7, { annual_salary: 2500000 });
    const [url, init] = fetchMock.mock.calls[0];
    expect([url, init.method]).toEqual(["http://localhost:3001/api/v1/employees/7", "PATCH"]);
    expect(JSON.parse(init.body)).toEqual({ employee: { annual_salary: 2500000 } });
    expect(updated.annual_salary).toBe(2500000);
  });

  it("update surfaces validation errors too", async () => {
    mockFetch(422, { errors: { annual_salary: ["must be greater than 0"] } });
    await expect(updateEmployee(7, { annual_salary: 0 })).rejects.toBeInstanceOf(ValidationError);
  });

  it("deactivation is a DELETE that returns the now-inactive record", async () => {
    const fetchMock = mockFetch(200, { data: { id: 7, active: false } });
    const result = await deactivateEmployee(7);
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
    expect(result.active).toBe(false);
  });
});
