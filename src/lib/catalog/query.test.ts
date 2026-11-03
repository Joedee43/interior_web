import { describe, expect, it } from "vitest";

import {
  buildCatalogUrl,
  buildNextPageUrl,
  hasActiveFilters,
  isFiltered,
  parseCatalogParams,
} from "./query";

describe("parseCatalogParams", () => {
  it("normalizes supported filters and discards unknown and sort parameters", () => {
    expect(
      parseCatalogParams({
        q: "  ergonomic desk  ",
        category: "  office-chairs  ",
        sort: "price_asc",
        extra: "discarded",
      }),
    ).toEqual({
      q: "ergonomic desk",
      category: "office-chairs",
      cursor: undefined,
    });
  });

  it("preserves an opaque cursor exactly", () => {
    const cursor = "  opaque+/= cursor  ";
    expect(parseCatalogParams({ cursor }).cursor).toBe(cursor);
    expect(
      parseCatalogParams(new URLSearchParams({ cursor })).cursor,
    ).toBe(cursor);
  });

  it("takes the first value for repeated parameters", () => {
    expect(
      parseCatalogParams({ q: ["table", "chair"], category: ["tables"] }),
    ).toEqual({ q: "table", category: "tables", cursor: undefined });
  });
});

describe("catalog URLs", () => {
  it("builds a clean filtered URL", () => {
    expect(buildCatalogUrl({ q: "lamp", category: "lighting" })).toBe(
      "/catalog?q=lamp&category=lighting",
    );
  });

  it("round-trips an opaque cursor without changing its value", () => {
    const cursor = "  opaque+/= cursor  ";
    const url = buildCatalogUrl({ cursor });
    expect(new URL(url, "http://example.test").searchParams.get("cursor")).toBe(
      cursor,
    );
  });

  it("preserves filters and replaces the prior cursor for the next page", () => {
    const url = buildNextPageUrl(
      { q: "sofa", category: "chairs", cursor: "old" },
      "new cursor+/=",
    );
    const parsed = new URL(url, "http://example.test");
    expect(parsed.pathname).toBe("/catalog");
    expect(parsed.searchParams.get("q")).toBe("sofa");
    expect(parsed.searchParams.get("category")).toBe("chairs");
    expect(parsed.searchParams.get("cursor")).toBe("new cursor+/=");
  });
});

describe("filter state", () => {
  it("detects search and category filters", () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ q: "desk" })).toBe(true);
    expect(hasActiveFilters({ category: "chairs" })).toBe(true);
    expect(isFiltered({ cursor: "page-two" })).toBe(false);
    expect(isFiltered({ q: "desk" })).toBe(true);
  });
});
