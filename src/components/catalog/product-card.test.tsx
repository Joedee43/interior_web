import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CatalogProductCard } from "@/lib/catalog/types";
import { ProductCard } from "./product-card";

const mockProduct: CatalogProductCard = {
  id: "test-product-1",
  slug: "oak-executive-desk",
  name: "Oak Executive Desk",
  description: "Handcrafted solid oak executive desk with cable management.",
  category: { slug: "desks", name: "Desks" },
  company: { slug: "woodcraft", name: "WoodCraft Ltd" },
  price: { amount_minor: 1850000, currency: "ETB" },
  formattedPrice: "ETB 18,500.00",
  dimensions: { width_mm: 1600, depth_mm: 800, height_mm: 760 },
  formattedDimensions: "1600 × 800 × 760 mm",
  primaryImageUrl: "/v1/media/img-123",
};

describe("ProductCard", () => {
  it("renders product name, maker, category, price and dimensions", () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText("Oak Executive Desk")).toBeInTheDocument();
    expect(screen.getByText("WoodCraft Ltd")).toBeInTheDocument();
    expect(screen.getByText("Desks")).toBeInTheDocument();
    expect(screen.getByText("ETB 18,500.00")).toBeInTheDocument();
    expect(screen.getByText("1600 × 800 × 760 mm")).toBeInTheDocument();
  });

  it("renders primary image with correct alt text", () => {
    render(<ProductCard product={mockProduct} />);

    const img = screen.getByRole("img", { name: "Oak Executive Desk" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/v1/media/img-123");
  });

  it("renders fallback placeholder when image URL is missing", () => {
    const productWithoutImage = { ...mockProduct, primaryImageUrl: null };
    render(<ProductCard product={productWithoutImage} />);

    expect(screen.getByTestId("product-image-fallback")).toBeInTheDocument();
    expect(screen.getByText("Image pending")).toBeInTheDocument();
  });
});
