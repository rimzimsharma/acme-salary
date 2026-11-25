import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "@/lib/api";
import type { BreakdownGroup, Outlier, Summary } from "@/lib/types";
import { renderWithProviders } from "@/test-utils";
import { InsightsPage } from "./InsightsPage";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  getSummary: vi.fn(),
  getBreakdown: vi.fn(),
  getOutliers: vi.fn(),
  getFilterOptions: vi.fn(),
}));

const summary: Summary = {
  headcount: 9384, inactive_count: 616, countries: 7, total_payroll_usd: 657097042,
  usd: { min: 6867, median: 63587, avg: 70023, max: 293000 },
};

const group = (key: string, headcount: number, median: number, local: BreakdownGroup["local"] = null): BreakdownGroup => ({
  key, headcount, usd: { min: median - 10000, median, avg: median, max: median + 10000, total: median * headcount }, local,
});

const india = group("India", 2183, 20000, { currency: "INR", min: 1000000, median: 1660000, avg: 1700000, max: 3000000 });
const japan = group("Japan", 808, 45000, { currency: "JPY", min: 5000000, median: 6750000, avg: 6800000, max: 9000000 });

beforeEach(() => {
  vi.mocked(api.getSummary).mockResolvedValue(summary);
  vi.mocked(api.getBreakdown).mockResolvedValue([india, japan]);
  vi.mocked(api.getOutliers).mockResolvedValue([]);
  vi.mocked(api.getFilterOptions).mockResolvedValue({
    countries: ["India", "Japan"], departments: [], job_titles: [], seniorities: ["junior", "mid", "senior", "lead", "executive"], currencies: [],
  });
});

describe("InsightsPage headline figures", () => {
  it("shows headcount, payroll, median pay and country count", async () => {
    renderWithProviders(<InsightsPage />);
    expect(await screen.findByText("9,384")).toBeInTheDocument(); // headcount
    expect(screen.getByText("$657,097,042")).toBeInTheDocument(); // total payroll
    expect(screen.getByText("$63,587")).toBeInTheDocument(); // median
    expect(screen.getByText("7")).toBeInTheDocument(); // countries
    expect(screen.getByText(/616 people who have left are not counted/)).toBeInTheDocument();
  });
});
