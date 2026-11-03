import {
  type CatalogQueryParams,
  type CatalogSort,
  CATALOG_SORTS,
  DEFAULT_CATALOG_SORT,
} from "./types";

export type RawSearchParams =
  | Record<string, string | string[] | undefined>
  | URLSearchParams;

/**
 * Normalizes input sort string to a supported CatalogSort. Defaults to "newest".
 */
export function normalizeSort(sort?: unknown): CatalogSort {
  if (typeof sort === "string") {
    const trimmed = sort.trim().toLowerCase();
    if (CATALOG_SORTS.some((option) => option.value === trimmed)) {
      return trimmed as CatalogSort;
    }
  }
  return DEFAULT_CATALOG_SORT;
}

/**
 * Parses and normalizes incoming search parameters strictly according to the catalog contract:
 * - q: trimmed non-empty string
 * - category: trimmed non-empty string
 * - sort: validated against CATALOG_SORTS, default "newest"
 * - cursor: trimmed non-empty string
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
  const rawSort = getParam("sort");
  const rawCursor = getParam("cursor")?.trim();

  return {
    q: rawQ && rawQ.length > 0 ? rawQ : undefined,
    category: rawCategory && rawCategory.length > 0 ? rawCategory : undefined,
    sort: normalizeSort(rawSort),
    cursor: rawCursor && rawCursor.length > 0 ? rawCursor : undefined,
  };
}

/**
 * Builds a canonical URL for /catalog given a partial set of query parameters.
 * Cleans out undefined/empty params, keeps sorting if non-default, and preserves cursor when passed.
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
  if (params.sort && params.sort !== DEFAULT_CATALOG_SORT) {
    search.set("sort", params.sort);
  }
  if (params.cursor && params.cursor.trim().length > 0) {
    search.set("cursor", params.cursor.trim());
  }

  const query = search.toString();
  return query.length > 0 ? `${basePath}?${query}` : basePath;
}

/**
 * Builds the URL for the next cursor page while preserving active search, category, and sort filters.
 */
export function buildNextPageUrl(
  current: CatalogQueryParams,
  nextCursor: string,
): string {
  return buildCatalogUrl({
    q: current.q,
    category: current.category,
    sort: current.sort,
    cursor: nextCursor,
  });
}

/**
 * Returns whether any search or category filter is currently active, or if sort is changed from default.
 */
export function hasActiveFilters(params: CatalogQueryParams): boolean {
  return Boolean(
    (params.q && params.q.length > 0) ||
      (params.category && params.category.length > 0) ||
      params.sort !== DEFAULT_CATALOG_SORT,
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
