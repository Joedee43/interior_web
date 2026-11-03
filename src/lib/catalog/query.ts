import type { CatalogQueryParams } from "./types";

export type RawSearchParams =
  | Record<string, string | string[] | undefined>
  | URLSearchParams;

/**
 * Parses and normalizes incoming search parameters strictly according to the catalog contract:
 * - q: trimmed non-empty string
 * - category: trimmed non-empty string
 * - cursor: an opaque, non-empty string preserved byte-for-byte
 * - Any unknown parameter is discarded.
 */
export function parseCatalogParams(params: RawSearchParams): CatalogQueryParams {
  const getParam = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) {
      return params.get(key) ?? undefined;
    }
    const val = params[key];
    if (Array.isArray(val)) {
      return val[0];
    }
    return val;
  };

  const rawQ = getParam("q")?.trim();
  const rawCategory = getParam("category")?.trim();
  const rawCursor = getParam("cursor");

  return {
    q: rawQ && rawQ.length > 0 ? rawQ : undefined,
    category: rawCategory && rawCategory.length > 0 ? rawCategory : undefined,
    cursor:
      rawCursor !== undefined && rawCursor.length > 0 ? rawCursor : undefined,
  };
}

/**
 * Builds a canonical URL for /catalog given a partial set of query parameters.
 * Cleans out undefined/empty filters and preserves an opaque cursor exactly.
 */
export function buildCatalogUrl(
  params: Partial<CatalogQueryParams>,
  basePath: string = "/catalog",
): string {
  const search = new URLSearchParams();

  if (params.q && params.q.trim().length > 0) {
    search.set("q", params.q.trim());
  }
  if (params.category && params.category.trim().length > 0) {
    search.set("category", params.category.trim());
  }
  if (params.cursor !== undefined && params.cursor.length > 0) {
    search.set("cursor", params.cursor);
  }

  const query = search.toString();
  return query.length > 0 ? `${basePath}?${query}` : basePath;
}

/**
 * Builds the URL for the next cursor page while preserving active filters.
 */
export function buildNextPageUrl(
  current: CatalogQueryParams,
  nextCursor: string,
): string {
  return buildCatalogUrl({
    q: current.q,
    category: current.category,
    cursor: nextCursor,
  });
}

/**
 * Returns whether any search or category filter is currently active.
 */
export function hasActiveFilters(params: CatalogQueryParams): boolean {
  return Boolean(
    (params.q && params.q.length > 0) ||
      (params.category && params.category.length > 0),
  );
}

/**
 * Returns whether any filtering (search or category) is applied.
 */
export function isFiltered(params: CatalogQueryParams): boolean {
  return Boolean(
    (params.q && params.q.length > 0) ||
      (params.category && params.category.length > 0),
  );
}
