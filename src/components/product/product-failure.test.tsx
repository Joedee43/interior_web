import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductFailure } from "./product-failure";

describe("ProductFailure", () => {
  it("shows the backend request ID and recovery links", () => {
    render(
      <ProductFailure
        requestId="backend-detail-123"
        retryUrl="/products/maker/chair"
      />,
    );

    expect(screen.getByText(/backend-detail-123/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /try again/i })).toHaveAttribute(
      "href",
      "/products/maker/chair",
    );
    expect(screen.getByRole("link", { name: /back to catalog/i })).toHaveAttribute(
      "href",
      "/catalog",
    );
  });
});
