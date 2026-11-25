import { afterEach, describe, expect, it, vi } from "vitest";
import { listEmployees } from "./api";

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
