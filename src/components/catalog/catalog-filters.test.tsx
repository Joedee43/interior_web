import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CatalogCategory, CatalogQueryParams } from "@/lib/catalog/types";
import { CatalogFilters } from "./catalog-filters";

const mockCategories: CatalogCategory[] = [
  { slug: "desks", name: "Desks" },
  { slug: "chairs", name: "Chairs" },
  { slug: "tables", name: "Tables" },
];

describe("CatalogFilters", () => {
  it("renders search and category controls without price sorting", () => {
    const params: CatalogQueryParams = {};

    render(<CatalogFilters categories={mockCategories} params={params} />);

    expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/sort by/i)).not.toBeInTheDocument();

    expect(screen.getByRole("option", { name: "All categories" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Desks" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Chairs" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Price: Low to High" }),
    ).not.toBeInTheDocument();
  });

  it("populates search and category inputs from current params", () => {
    const params: CatalogQueryParams = {
      q: "ergonomic",
      category: "chairs",
    };

    render(<CatalogFilters categories={mockCategories} params={params} />);

    const searchInput = screen.getByLabelText(/search/i) as HTMLInputElement;
    const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;

    expect(searchInput.value).toBe("ergonomic");
    expect(categorySelect.value).toBe("chairs");
  });

  it("renders a clear button only when active filters exist", () => {
    const { rerender } = render(
      <CatalogFilters categories={mockCategories} params={{}} />,
    );
    expect(screen.queryByRole("link", { name: /clear/i })).not.toBeInTheDocument();

    rerender(
      <CatalogFilters
        categories={mockCategories}
        params={{ q: "desk" }}
      />,
    );
    expect(screen.getByRole("link", { name: /clear/i })).toBeInTheDocument();
  });
});
