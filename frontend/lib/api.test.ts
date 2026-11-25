import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, listEmployees } from "./api";

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
