import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthServiceFailure } from "./auth-service-failure";

describe("AuthServiceFailure", () => {
  it("shows the backend request ID and retry location", () => {
    render(
      <AuthServiceFailure requestId="auth-backend-500" retryUrl="/account" />,
    );
    expect(screen.getByText(/auth-backend-500/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute(
      "href",
      "/account",
    );
  });
});

