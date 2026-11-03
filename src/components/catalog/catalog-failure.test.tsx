import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CatalogFailure } from "./catalog-failure";

describe("CatalogFailure", () => {
  it("shows the backend request ID and recovery actions", () => {
    render(
      <CatalogFailure
        requestId="backend-request-123"
        retryUrl="/catalog?q=chair"
      />,
    );

    expect(screen.getByText(/backend-request-123/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /try again/i })).toHaveAttribute(
      "href",
      "/catalog?q=chair",
    );
    expect(screen.getByRole("link", { name: /reset catalog/i })).toHaveAttribute(
      "href",
      "/catalog",
    );
  });
});
