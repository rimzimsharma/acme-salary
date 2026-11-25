import { describe, expect, it } from "vitest";
import { formatDeviation, formatMoney } from "./format";

describe("formatMoney", () => {
  it("formats whole amounts with the currency symbol and thousands separators", () => {
    expect(formatMoney(100000, "USD")).toBe("$100,000");
  });

  it("shows a dash when there is no figure to display", () => {
    expect(formatMoney(null, "USD")).toBe("—");
    expect(formatMoney(undefined, "INR")).toBe("—");
  });

  it("handles currencies without decimals and with prefixes", () => {
    expect(formatMoney(15000000, "JPY")).toBe("¥15,000,000");
    expect(formatMoney(85000, "CAD")).toBe("CA$85,000");
  });
});

describe("formatDeviation", () => {
  it("signs the percentage so direction is obvious", () => {
    expect(formatDeviation(104)).toBe("+104%");
    expect(formatDeviation(-52)).toBe("-52%");
    expect(formatDeviation(0)).toBe("0%");
  });
});
