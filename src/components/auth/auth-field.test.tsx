import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AuthField } from "./auth-field";

describe("AuthField", () => {
  it("renders label and input with correct associations", () => {
    render(<AuthField id="email" label="Email address" type="email" />);

    const input = screen.getByLabelText("Email address");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("id", "email");
    expect(input).toHaveAttribute("type", "email");
    expect(
      screen.queryByTestId("email-toggle-password"),
    ).not.toBeInTheDocument();
  });

  it("displays error message when provided", () => {
    render(
      <AuthField
        id="email"
        label="Email address"
        type="email"
        error="Invalid email"
      />,
    );

    const input = screen.getByLabelText("Email address");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Invalid email")).toBeInTheDocument();
  });

  it("renders password toggle button and toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<AuthField id="password" label="Password" type="password" />);

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByRole("button", { name: "Show password" });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("aria-pressed", "false");

    // Click toggle to show password
    await user.click(toggleBtn);

    expect(input).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("aria-pressed", "true");

    // Click toggle again to hide password
    await user.click(toggleBtn);

    expect(input).toHaveAttribute("type", "password");
    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("aria-pressed", "false");
  });
});
