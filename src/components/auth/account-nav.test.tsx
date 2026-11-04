import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAccountQuery } from "@/lib/auth/query";
import { AccountNav } from "./account-nav";

vi.mock("@/lib/auth/query", () => ({ useAccountQuery: vi.fn() }));
vi.mock("./logout-button", () => ({
  LogoutButton: () => <button type="button">Sign out</button>,
}));

beforeEach(() => vi.clearAllMocks());

describe("AccountNav", () => {
  it("renders stable loading and signed-out states", () => {
    vi.mocked(useAccountQuery).mockReturnValue({ isPending: true } as ReturnType<
      typeof useAccountQuery
    >);
    const { rerender } = render(<AccountNav />);
    expect(screen.getByLabelText("Loading account")).toBeVisible();

    vi.mocked(useAccountQuery).mockReturnValue({
      isPending: false,
      isError: false,
      data: null,
    } as ReturnType<typeof useAccountQuery>);
    rerender(<AccountNav />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows the user without company navigation", () => {
    vi.mocked(useAccountQuery).mockReturnValue({
      isPending: false,
      isError: false,
      data: { user: { fullName: "Demo Customer" } },
    } as ReturnType<typeof useAccountQuery>);
    render(<AccountNav />);
    expect(screen.getByRole("link", { name: "Demo" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  it("shows a retry state instead of pretending an error is signed out", async () => {
    const refetch = vi.fn();
    vi.mocked(useAccountQuery).mockReturnValue({
      isPending: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useAccountQuery>);
    render(<AccountNav />);
    await userEvent.click(
      screen.getByRole("button", { name: /account unavailable/i }),
    );
    expect(refetch).toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
  });
});

