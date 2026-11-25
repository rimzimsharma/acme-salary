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

describe("InsightsPage pay breakdown", () => {
  it("starts with pay by country: headcount, USD median and range, plus local-currency median", async () => {
    renderWithProviders(<InsightsPage />);
    const table = within(await screen.findByRole("table", { name: "Pay by country" }));

    const indiaRow = within(table.getByRole("row", { name: /India/ }));
    expect(indiaRow.getByText("2,183")).toBeInTheDocument();
    expect(indiaRow.getByText("$20,000")).toBeInTheDocument(); // USD median
    expect(indiaRow.getByText("$10,000 – $30,000")).toBeInTheDocument(); // USD min–max
    expect(indiaRow.getByText("₹1,660,000")).toBeInTheDocument(); // local median
    expect(api.getBreakdown).toHaveBeenCalledWith("country", {});
  });

  it("shows a dash for local pay when a group mixes currencies", async () => {
    vi.mocked(api.getBreakdown).mockResolvedValue([group("Engineering", 100, 60000, null)]);
    renderWithProviders(<InsightsPage />);
    const row = within(await screen.findByRole("row", { name: /Engineering/ }));
    expect(row.getByText("—")).toBeInTheDocument();
  });
});

describe("InsightsPage dimensions and drill-down", () => {
  it("switches the grouping between country, department, job title and seniority", async () => {
    renderWithProviders(<InsightsPage />);
    await screen.findByRole("table", { name: "Pay by country" });

    vi.mocked(api.getBreakdown).mockResolvedValue([group("Engineering", 3000, 70000)]);
    await userEvent.click(screen.getByRole("radio", { name: "Department" }));

    expect(await screen.findByRole("table", { name: "Pay by department" })).toBeInTheDocument();
    expect(api.getBreakdown).toHaveBeenLastCalledWith("department", {});

    await userEvent.click(screen.getByRole("radio", { name: "Job title" }));
    await waitFor(() => expect(api.getBreakdown).toHaveBeenLastCalledWith("job_title", {}));
  });

  it("lists seniority from junior up to executive, not by headcount", async () => {
    renderWithProviders(<InsightsPage />);
    await screen.findByRole("table", { name: "Pay by country" });
    vi.mocked(api.getBreakdown).mockResolvedValue([group("mid", 3289, 61000), group("executive", 387, 154000), group("junior", 2305, 43000), group("lead", 1061, 101000), group("senior", 2342, 81000)]);

    await userEvent.click(screen.getByRole("radio", { name: "Seniority" }));
    const table = await screen.findByRole("table", { name: "Pay by seniority" });
    const order = within(table).getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[0].textContent);
    expect(order).toEqual(["junior", "mid", "senior", "lead", "executive"]);
  });

  it("narrows to one country for non-country groupings, and hides that filter when grouping by country", async () => {
    renderWithProviders(<InsightsPage />);
    await screen.findByRole("table", { name: "Pay by country" });
    expect(screen.queryByLabelText("Within country")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: "Job title" }));
    await userEvent.selectOptions(await screen.findByLabelText("Within country"), "India");
    await waitFor(() => expect(api.getBreakdown).toHaveBeenLastCalledWith("job_title", { country: "India" }));
  });
});
