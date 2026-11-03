import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CatalogPagination } from "./catalog-pagination";

describe("CatalogPagination", () => {
  it("renders next page link preserving current filters", () => {
    render(
      <CatalogPagination
        currentParams={{
          q: "table",
          category: "dining",
        }}
        nextCursor="cursor-page-2"
      />,
    );

    const nextLink = screen.getByRole("link", { name: /next page/i });
    expect(nextLink).toBeInTheDocument();
    expect(nextLink).toHaveAttribute(
      "href",
      "/catalog?q=table&category=dining&cursor=cursor-page-2",
    );
  });

  it("returns null when nextCursor is null", () => {
    const { container } = render(
      <CatalogPagination
        currentParams={{}}
        nextCursor={null}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
