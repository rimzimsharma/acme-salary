import { describe, expect, it } from "vitest";
import { todayLocal } from "./dates";

// vitest.config.mts pins TZ to Asia/Kolkata (UTC+5:30), so these tests behave the same on every machine.
describe("todayLocal", () => {
  it("is the calendar date where the user is, not the UTC date", () => {
    // 20:00 UTC on the 24th is already 01:30 on the 25th in India.
    expect(todayLocal(new Date("2026-11-24T20:00:00Z"))).toBe("2026-11-25");
  });

  it("stays on the same day until local midnight", () => {
    expect(todayLocal(new Date("2026-11-25T18:29:00Z"))).toBe("2026-11-25"); // 23:59 in India
    expect(todayLocal(new Date("2026-11-25T18:30:00Z"))).toBe("2026-11-26"); // 00:00 in India
  });

  it("pads single-digit months and days", () => {
    expect(todayLocal(new Date("2026-03-04T10:00:00Z"))).toBe("2026-03-04");
  });
});
