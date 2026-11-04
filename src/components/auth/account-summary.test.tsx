import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Account } from "@/lib/auth/types";
import { AccountSummary } from "./account-summary";

vi.mock("./logout-button", () => ({
  LogoutButton: () => <button type="button">Sign out</button>,
}));

const account: Account = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    email: "demo@example.com",
    fullName: "Demo Customer",
    status: "active",
    isPlatformAdmin: false,
    createdAt: "2026-01-02T03:04:05Z",
  },
  memberships: [
    {
      company: {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Active Maker",
        slug: "active-maker",
        status: "active",
      },
      role: "company_admin",
      status: "active",
    },
    {
      company: {
        id: "33333333-3333-4333-8333-333333333333",
        name: "Hidden Maker",
        slug: "hidden-maker",
        status: "active",
      },
      role: "company_staff",
      status: "disabled",
    },
  ],
};

describe("AccountSummary", () => {
  it("shows identity and active memberships only", () => {
    render(<AccountSummary account={account} />);
    expect(screen.getByRole("heading", { name: "Demo Customer" })).toBeVisible();
    expect(screen.getByText("Active Maker")).toBeVisible();
    expect(screen.getByText("Company admin")).toBeVisible();
    expect(screen.queryByText("Hidden Maker")).not.toBeInTheDocument();
  });
});

