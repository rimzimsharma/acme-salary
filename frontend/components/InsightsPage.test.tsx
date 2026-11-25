import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
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

describe("InsightsPage outliers", () => {
  const outlier = (over: Partial<Outlier> = {}): Outlier => ({
    id: 1, full_name: "Hana Johnson", job_title: "Marketing Specialist", country: "Canada", seniority: "senior",
    currency: "CAD", annual_salary: 203000, salary_usd: 149265, peer_median_usd: 72427, direction: "above", deviation_pct: 106, ...over,
  });

  it("lists people paid far from their peers with how far, and which way", async () => {
    vi.mocked(api.getOutliers).mockResolvedValue([outlier(), outlier({ id: 2, full_name: "Sofia Taylor", direction: "below", deviation_pct: -52, salary_usd: 11807, peer_median_usd: 24096, country: "India", currency: "INR", annual_salary: 980000 })]);
    renderWithProviders(<InsightsPage />);

    const table = within(await screen.findByRole("table", { name: "Pay outliers" }));
    const hana = within(table.getByRole("row", { name: /Hana Johnson/ }));
    expect(hana.getByText("+106%")).toBeInTheDocument();
    expect(hana.getByText("CA$203,000")).toBeInTheDocument();
    expect(hana.getByText("$72,427")).toBeInTheDocument(); // peer median
    expect(hana.getByText(/above peers/)).toBeInTheDocument();
    const sofia = within(table.getByRole("row", { name: /Sofia Taylor/ }));
    expect(sofia.getByText("-52%")).toBeInTheDocument();
    expect(sofia.getByText(/below peers/)).toBeInTheDocument();
  });

  it("says so when nobody stands out", async () => {
    renderWithProviders(<InsightsPage />);
    expect(await screen.findByText("No unusual pay found.")).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "Pay outliers" })).not.toBeInTheDocument();
  });

  it("explains how outliers are chosen", async () => {
    renderWithProviders(<InsightsPage />);
    expect(await screen.findByText(/same country, job title and seniority/)).toBeInTheDocument();
  });
});

describe("InsightsPage failures", () => {
  it("shows what went wrong and recovers when the user retries", async () => {
    vi.mocked(api.getSummary).mockRejectedValueOnce(new ApiError(0, "Could not reach the server. Is the API running?"));
    renderWithProviders(<InsightsPage />);

    expect(await screen.findByText("Could not reach the server. Is the API running?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("9,384")).toBeInTheDocument();
    expect(screen.queryByText(/Could not reach/)).not.toBeInTheDocument();
  });

  it("also reports a failing breakdown or outlier request", async () => {
    vi.mocked(api.getOutliers).mockRejectedValueOnce(new ApiError(500, "Request failed (500)"));
    renderWithProviders(<InsightsPage />);
    expect(await screen.findByText("Request failed (500)")).toBeInTheDocument();
  });
});

describe("InsightsPage chart", () => {
  it("charts median USD pay for the current grouping, with the table as its text equivalent", async () => {
    renderWithProviders(<InsightsPage />);
    expect(await screen.findByRole("img", { name: "Bar chart of median pay in USD by country" })).toBeInTheDocument();

    vi.mocked(api.getBreakdown).mockResolvedValue([group("Sales", 10, 50000)]);
    await userEvent.click(screen.getByRole("radio", { name: "Department" }));
    expect(await screen.findByRole("img", { name: "Bar chart of median pay in USD by department" })).toBeInTheDocument();
  });
});
