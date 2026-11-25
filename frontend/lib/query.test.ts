import { describe, expect, it } from "vitest";
import { buildQuery } from "./query";

describe("buildQuery", () => {
  it("joins params as a query string", () => {
    expect(buildQuery({ country: "India", page: 2 })).toBe("?country=India&page=2");
  });
});
