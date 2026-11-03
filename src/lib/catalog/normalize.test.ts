import { describe, expect, it } from "vitest";

import {
  normalizeCategories,
  normalizeCategory,
  normalizeProductCard,
  normalizeProductPage,
} from "./normalize";

describe("normalizeCategory", () => {
  it("normalizes valid category object", () => {
    expect(normalizeCategory({ slug: "chairs", name: "Chairs" })).toEqual({
      slug: "chairs",
      name: "Chairs",
    });
  });

  it("returns null for invalid category data", () => {
    expect(normalizeCategory(null)).toBeNull();
    expect(normalizeCategory({})).toBeNull();
    expect(normalizeCategory({ slug: "chairs" })).toBeNull();
    expect(normalizeCategory({ name: "Chairs" })).toBeNull();
  });
});

describe("normalizeCategories", () => {
  it("filters out invalid categories and returns valid ones", () => {
    const raw = {
      categories: [
        { slug: "desks", name: "Desks" },
        null,
        { invalid: true },
        { slug: "tables", name: "Tables" },
      ],
    };
    expect(normalizeCategories(raw)).toEqual([
      { slug: "desks", name: "Desks" },
      { slug: "tables", name: "Tables" },
    ]);
  });

  it("returns empty array for invalid container", () => {
    expect(normalizeCategories(null)).toEqual([]);
    expect(normalizeCategories({})).toEqual([]);
    expect(normalizeCategories({ categories: "not-an-array" })).toEqual([]);
  });
});

describe("normalizeProductCard", () => {
  it("normalizes a full product record", () => {
    const raw = {
      id: "prod-1",
      slug: "ergonomic-chair",
      name: "Ergonomic Task Chair",
      description: "Comfortable mesh chair",
      category: { slug: "chairs", name: "Chairs" },
      company: { slug: "acme", name: "Acme Seating" },
      price: { amount_minor: 1200000, currency: "ETB" },
      dimensions: { width_mm: 650, depth_mm: 600, height_mm: 1100 },
      primary_image_url: "/v1/media/image-123",
    };

    const normalized = normalizeProductCard(raw);
    expect(normalized).not.toBeNull();
    expect(normalized?.id).toBe("prod-1");
    expect(normalized?.slug).toBe("ergonomic-chair");
    expect(normalized?.name).toBe("Ergonomic Task Chair");
    expect(normalized?.company.name).toBe("Acme Seating");
    expect(normalized?.category.name).toBe("Chairs");
    expect(normalized?.formattedPrice.replace(/\u00a0/g, " ")).toBe(
      "ETB 12,000.00",
    );
    expect(normalized?.formattedDimensions).toBe("650 × 600 × 1100 mm");
    expect(normalized?.primaryImageUrl).toBe("/v1/media/image-123");
  });

  it("handles missing primary image gracefully", () => {
    const raw = {
      id: "prod-2",
      slug: "basic-table",
      name: "Basic Table",
      category: { slug: "tables", name: "Tables" },
      company: { slug: "maker", name: "Maker" },
      price: { amount_minor: 500000, currency: "ETB" },
      dimensions: { width_mm: 1200, depth_mm: 800, height_mm: 750 },
      primary_image_url: null,
    };

    const normalized = normalizeProductCard(raw);
    expect(normalized?.primaryImageUrl).toBeNull();
  });

  it("returns null when product identity is missing", () => {
    expect(normalizeProductCard(null)).toBeNull();
    expect(normalizeProductCard({ id: "p1" })).toBeNull();
    expect(normalizeProductCard({ name: "Chair" })).toBeNull();
  });
});

describe("normalizeProductPage", () => {
  it("normalizes product list and preserves opaque next cursor", () => {
    const raw = {
      products: [
        {
          id: "p1",
          slug: "desk",
          name: "Standing Desk",
          category: { slug: "desks", name: "Desks" },
          company: { slug: "c1", name: "Company" },
          price: { amount_minor: 2500000, currency: "ETB" },
          dimensions: { width_mm: 1400, depth_mm: 800, height_mm: 1050 },
        },
      ],
      next_cursor: "eyJsYXN0X2lkIjoiMTIzIn0",
    };

    const page = normalizeProductPage(raw);
    expect(page.products).toHaveLength(1);
    expect(page.nextCursor).toBe("eyJsYXN0X2lkIjoiMTIzIn0");
  });

  it("handles empty or missing results gracefully", () => {
    expect(normalizeProductPage(null)).toEqual({
      products: [],
      nextCursor: null,
    });
    expect(normalizeProductPage({})).toEqual({
      products: [],
      nextCursor: null,
    });
  });
});
