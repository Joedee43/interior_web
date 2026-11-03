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
  it("renders search input, category options, and sort options", () => {
    const params: CatalogQueryParams = { sort: "newest" };

    render(<CatalogFilters categories={mockCategories} params={params} />);

    expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();

    expect(screen.getByRole("option", { name: "All categories" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Desks" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Chairs" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Newest arrivals" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Price: Low to High" })).toBeInTheDocument();
  });

  it("populates search and category inputs from current params", () => {
    const params: CatalogQueryParams = {
      q: "ergonomic",
      category: "chairs",
      sort: "price_asc",
    };

    render(<CatalogFilters categories={mockCategories} params={params} />);

    const searchInput = screen.getByLabelText(/search/i) as HTMLInputElement;
    const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
    const sortSelect = screen.getByLabelText(/sort by/i) as HTMLSelectElement;

    expect(searchInput.value).toBe("ergonomic");
    expect(categorySelect.value).toBe("chairs");
    expect(sortSelect.value).toBe("price_asc");
  });

  it("renders a clear button only when active filters exist", () => {
    const { rerender } = render(
      <CatalogFilters categories={mockCategories} params={{ sort: "newest" }} />,
    );
    expect(screen.queryByRole("link", { name: /clear/i })).not.toBeInTheDocument();

    rerender(
      <CatalogFilters
        categories={mockCategories}
        params={{ q: "desk", sort: "newest" }}
      />,
    );
    expect(screen.getByRole("link", { name: /clear/i })).toBeInTheDocument();
  });
});
