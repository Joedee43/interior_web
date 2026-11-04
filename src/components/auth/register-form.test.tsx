import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/error";
import { registerCustomer } from "@/lib/auth/api";
import { RegisterForm } from "./register-form";

const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));
vi.mock("@/lib/auth/api", () => ({ registerCustomer: vi.fn() }));

function renderForm() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RegisterForm nextPath="/account" />
    </QueryClientProvider>,
  );
}

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText("Full name"), "New Customer");
  await userEvent.type(screen.getByLabelText("Email address"), "new@example.com");
  await userEvent.type(screen.getByLabelText("Password", { exact: true }), "password 123");
  await userEvent.type(screen.getByLabelText("Confirm password"), "password 123");
}

beforeEach(() => vi.clearAllMocks());

describe("RegisterForm", () => {
  it("rejects a mismatched confirmation locally", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText("Full name"), "New Customer");
    await userEvent.type(screen.getByLabelText("Email address"), "new@example.com");
    await userEvent.type(screen.getByLabelText("Password", { exact: true }), "password 123");
    await userEvent.type(screen.getByLabelText("Confirm password"), "different 123");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Passwords do not match")).toBeVisible();
    expect(registerCustomer).not.toHaveBeenCalled();
  });

  it("maps duplicate email errors to the email field", async () => {
    vi.mocked(registerCustomer).mockRejectedValue(
      new ApiError(409, {
        code: "email_taken",
        message: "taken",
        request_id: "register-request-1",
      }),
    );
    renderForm();
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      (await screen.findAllByText(/account with this email already exists/i))[0],
    ).toBeVisible();
    expect(screen.getByText(/register-request-1/)).toBeVisible();
  });
});

