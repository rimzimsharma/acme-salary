import { describe, expect, it } from "vitest";
import { buildQuery } from "./query";

describe("buildQuery", () => {
  it("joins params as a query string", () => {
    expect(buildQuery({ country: "India", page: 2 })).toBe("?country=India&page=2");
  });

  it("leaves out blank, null and undefined values so the API sees only real filters", () => {
    expect(buildQuery({ q: "", country: undefined, department: null, page: 1 })).toBe("?page=1");
    expect(buildQuery({})).toBe("");
    expect(buildQuery({ q: "   " })).toBe("");
  });

  it("keeps zero as a value", () => {
    expect(buildQuery({ page: 0 })).toBe("?page=0");
  });

  it("encodes special characters", () => {
    expect(buildQuery({ q: "100% & more" })).toBe("?q=100%25+%26+more");
  });
});
