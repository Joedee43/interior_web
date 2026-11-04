import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/error";
import type { Account } from "@/lib/auth/types";
import { login } from "@/lib/auth/api";
import { LoginForm } from "./login-form";

const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));
vi.mock("@/lib/auth/api", () => ({ login: vi.fn() }));

const account: Account = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    email: "demo@example.com",
    fullName: "Demo Customer",
    status: "active",
    isPlatformAdmin: false,
    createdAt: "2026-01-02T03:04:05Z",
  },
  memberships: [],
};

function renderForm() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <LoginForm nextPath="/account" />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginForm", () => {
  it("validates fields before calling the API", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Email is required")).toBeVisible();
    expect(screen.getByText(/at least 12 characters/i)).toBeVisible();
    expect(login).not.toHaveBeenCalled();
  });

  it("stores the account and follows the safe return path", async () => {
    vi.mocked(login).mockResolvedValue(account);
    renderForm();
    await userEvent.type(screen.getByLabelText("Email address"), "demo@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password 123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(vi.mocked(login).mock.calls[0]?.[0]).toEqual({
      email: "demo@example.com",
      password: "password 123",
    });
    expect(replace).toHaveBeenCalledWith("/account");
    expect(refresh).toHaveBeenCalled();
  });

  it("maps backend fields and displays the real request ID", async () => {
    vi.mocked(login).mockRejectedValue(
      new ApiError(400, {
        code: "validation_failed",
        message: "invalid",
        details: { email: "is not accepted" },
        request_id: "login-request-1",
      }),
    );
    renderForm();
    await userEvent.type(screen.getByLabelText("Email address"), "demo@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password 123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("is not accepted")).toBeVisible();
    expect(screen.getByText(/login-request-1/)).toBeVisible();
  });
});

