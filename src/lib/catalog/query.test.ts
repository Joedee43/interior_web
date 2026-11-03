import { describe, expect, it } from "vitest";

import {
  buildCatalogUrl,
  buildNextPageUrl,
  hasActiveFilters,
  isFiltered,
  normalizeSort,
  parseCatalogParams,
} from "./query";

describe("normalizeSort", () => {
  it("accepts valid sort values", () => {
    expect(normalizeSort("newest")).toBe("newest");
    expect(normalizeSort("price_asc")).toBe("price_asc");
    expect(normalizeSort("price_desc")).toBe("price_desc");
  });

  it("handles case-insensitivity and extra whitespace", () => {
    expect(normalizeSort("  PRICE_ASC  ")).toBe("price_asc");
    expect(normalizeSort("Price_Desc")).toBe("price_desc");
  });

  it("defaults unknown or invalid sorts to newest", () => {
    expect(normalizeSort("random_sort")).toBe("newest");
    expect(normalizeSort("")).toBe("newest");
    expect(normalizeSort(undefined)).toBe("newest");
    expect(normalizeSort(null)).toBe("newest");
  });
});

describe("parseCatalogParams", () => {
  it("parses valid query parameters from a plain object", () => {
    const parsed = parseCatalogParams({
      q: "ergonomic desk",
      category: "desks",
      sort: "price_asc",
      cursor: "cursor-123",
      extra: "discarded",
    });

    expect(parsed).toEqual({
      q: "ergonomic desk",
      category: "desks",
      sort: "price_asc",
      cursor: "cursor-123",
    });
    expect(parsed).not.toHaveProperty("extra");
  });

  it("parses from URLSearchParams instance", () => {
    const search = new URLSearchParams(
      "q=chair&category=chairs&sort=price_desc&cursor=opaque-token",
    );
    const parsed = parseCatalogParams(search);

    expect(parsed).toEqual({
      q: "chair",
      category: "chairs",
      sort: "price_desc",
      cursor: "opaque-token",
    });
  });

  it("trims strings and discards whitespace-only fields", () => {
    const parsed = parseCatalogParams({
      q: "   ",
      category: "  office-chairs  ",
      cursor: "",
    });

    expect(parsed).toEqual({
      q: undefined,
      category: "office-chairs",
      sort: "newest",
      cursor: undefined,
    });
  });

  it("handles array parameters by taking the first element", () => {
    const parsed = parseCatalogParams({
      q: ["table", "second-table"],
      category: ["tables"],
    });

    expect(parsed.q).toBe("table");
    expect(parsed.category).toBe("tables");
  });
});

describe("buildCatalogUrl", () => {
  it("builds clean URL without default sort", () => {
    const url = buildCatalogUrl({
      q: "lamp",
      sort: "newest",
    });
    expect(url).toBe("/catalog?q=lamp");
  });

  it("includes non-default sort and category", () => {
    const url = buildCatalogUrl({
      category: "lighting",
      sort: "price_desc",
    });
    expect(url).toBe("/catalog?category=lighting&sort=price_desc");
  });

  it("returns base path when parameters are empty", () => {
    expect(buildCatalogUrl({})).toBe("/catalog");
    expect(buildCatalogUrl({ sort: "newest", q: "" })).toBe("/catalog");
  });

  it("includes cursor when supplied", () => {
    const url = buildCatalogUrl({
      category: "chairs",
      cursor: "abc-123",
    });
    expect(url).toBe("/catalog?category=chairs&cursor=abc-123");
  });
});

describe("buildNextPageUrl", () => {
  it("preserves active query, category and sort while attaching next cursor", () => {
    const url = buildNextPageUrl(
      {
        q: "sofa",
        category: "living-room",
        sort: "price_asc",
        cursor: "old-cursor",
      },
      "new-cursor-456",
    );

    expect(url).toBe(
      "/catalog?q=sofa&category=living-room&sort=price_asc&cursor=new-cursor-456",
    );
  });
});

describe("filter state checks", () => {
  it("identifies active filters and sorting", () => {
    expect(hasActiveFilters({ sort: "newest" })).toBe(false);
    expect(hasActiveFilters({ sort: "price_asc" })).toBe(true);
    expect(hasActiveFilters({ q: "desk", sort: "newest" })).toBe(true);
    expect(hasActiveFilters({ category: "chairs", sort: "newest" })).toBe(true);
  });

  it("identifies search and category filtering specifically", () => {
    expect(isFiltered({ sort: "price_desc" })).toBe(false);
    expect(isFiltered({ q: "chair", sort: "newest" })).toBe(true);
    expect(isFiltered({ category: "chairs", sort: "price_asc" })).toBe(true);
  });
});
