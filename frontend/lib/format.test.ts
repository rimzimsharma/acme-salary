import { describe, expect, it } from "vitest";
import { formatMoney } from "./format";

describe("formatMoney", () => {
  it("formats whole amounts with the currency symbol and thousands separators", () => {
    expect(formatMoney(100000, "USD")).toBe("$100,000");
  });
});
