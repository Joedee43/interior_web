import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CatalogEmpty } from "./catalog-empty";

describe("CatalogEmpty", () => {
  it("renders filtered empty message with clear button when search is active", () => {
    render(<CatalogEmpty params={{ q: "nonexistent" }} />);

    expect(
      screen.getByText("No furniture matches your search"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /clear all filters/i }),
    ).toHaveAttribute("href", "/catalog");
  });

  it("renders filtered empty message when category filter is active", () => {
    render(<CatalogEmpty params={{ category: "chairs" }} />);

    expect(
      screen.getByText("No furniture matches your search"),
    ).toBeInTheDocument();
  });

  it("renders unfiltered empty message when no filters are set", () => {
    render(<CatalogEmpty params={{}} />);

    expect(
      screen.getByText("No furniture available yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to home/i }),
    ).toHaveAttribute("href", "/");
  });
});
