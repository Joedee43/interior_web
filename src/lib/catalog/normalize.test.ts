import { describe, expect, it } from "vitest";

import {
  CatalogContractError,
  normalizeCategories,
  normalizeProductCard,
  normalizeProductPage,
} from "./normalize";

const product = {
  id: "prod-1",
  slug: "ergonomic-chair",
  name: "Ergonomic Task Chair",
  description: "Comfortable mesh chair",
  category: { slug: "chairs", name: "Chairs" },
  company: { slug: "acme", name: "Acme Seating" },
  price: { amount_minor: 1_200_000, currency: "ETB" },
  dimensions: { width_mm: 650, depth_mm: 600, height_mm: 1100 },
  primary_image_url: "/v1/media/image-123",
};

describe("catalog response normalization", () => {
  it("normalizes complete categories and products", () => {
    expect(
      normalizeCategories({
        categories: [{ slug: "chairs", name: "Chairs" }],
      }),
    ).toEqual([{ slug: "chairs", name: "Chairs" }]);

    const normalized = normalizeProductCard(product);
    expect(normalized.company.name).toBe("Acme Seating");
    expect(normalized.formattedPrice.replace(/\u00a0/g, " ")).toBe(
      "ETB 12,000.00",
    );
    expect(normalized.formattedDimensions).toBe("650 × 600 × 1100 mm");
  });

  it("allows a nullable image and optional description", () => {
    expect(
      normalizeProductCard({
        ...product,
        description: undefined,
        primary_image_url: null,
      }),
    ).toMatchObject({ description: undefined, primaryImageUrl: null });
  });

  it.each([
    ["missing company", { ...product, company: undefined }],
    ["missing price", { ...product, price: undefined }],
    ["negative price", { ...product, price: { amount_minor: -1, currency: "ETB" } }],
    ["invalid currency", { ...product, price: { amount_minor: 1, currency: "etb" } }],
    ["zero dimension", { ...product, dimensions: { width_mm: 0, depth_mm: 1, height_mm: 1 } }],
    ["missing image field", { ...product, primary_image_url: undefined }],
  ])("rejects %s instead of fabricating card data", (_name, value) => {
    expect(() => normalizeProductCard(value)).toThrow(CatalogContractError);
  });

  it("rejects malformed categories instead of silently dropping them", () => {
    expect(() =>
      normalizeCategories({
        categories: [{ slug: "chairs", name: "Chairs" }, null],
      }),
    ).toThrow(CatalogContractError);
  });

  it("preserves the next cursor byte-for-byte", () => {
    const cursor = "  opaque+/= cursor  ";
    expect(
      normalizeProductPage({ products: [product], next_cursor: cursor })
        .nextCursor,
    ).toBe(cursor);
  });

  it.each([
    null,
    {},
    { products: "not-an-array", next_cursor: null },
    { products: [], next_cursor: undefined },
    { products: [], next_cursor: "" },
  ])("rejects a malformed product page", (value) => {
    expect(() => normalizeProductPage(value)).toThrow(CatalogContractError);
  });
});
