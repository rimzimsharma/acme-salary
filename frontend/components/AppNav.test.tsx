import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test-utils";
import { AppNav } from "./AppNav";

const pathname = vi.hoisted(() => ({ current: "/employees" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

describe("AppNav", () => {
  it("links to Employees and Insights", () => {
    renderWithProviders(<AppNav />);
    expect(screen.getByRole("link", { name: "Employees" })).toHaveAttribute("href", "/employees");
    expect(screen.getByRole("link", { name: "Insights" })).toHaveAttribute("href", "/insights");
  });

  it("marks only the current section as the current page", () => {
    pathname.current = "/insights";
    renderWithProviders(<AppNav />);
    expect(screen.getByRole("link", { name: "Insights" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Employees" })).not.toHaveAttribute("aria-current");
  });
});
