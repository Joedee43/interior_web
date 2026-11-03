import "server-only";

import { ApiError } from "@/lib/api/error";
import { serverApiFetch } from "@/lib/api/server";
import { normalizeCategories, normalizeProductPage } from "./normalize";
import type {
  CatalogCategory,
  CatalogPage,
  CatalogQueryParams,
} from "./types";

export const CATALOG_PAGE_SIZE = 20;

/**
 * Fetches all platform-wide furniture categories from the Go backend.
 */
export async function fetchCatalogCategories(): Promise<CatalogCategory[]> {
  try {
    const raw = await serverApiFetch<{ categories?: unknown[] }>(
      "/v1/catalog/categories",
      { cache: "no-store" },
    );
    return normalizeCategories(raw);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(
        `Failed to fetch catalog categories [status ${error.status}, code ${error.code}]`,
        error.message,
      );
    } else {
      console.error("Unexpected error fetching catalog categories", error);
    }
    return [];
  }
}

/**
 * Fetches published products for public browsing.
 * - Uses a fixed limit of 20.
 * - Forwards q, category, sort, and opaque cursor.
 * - Recovers gracefully from an invalid or expired cursor by falling back to the first page.
 */
export async function fetchCatalogProducts(
  params: CatalogQueryParams,
): Promise<CatalogPage> {
  const query = new URLSearchParams({
    limit: String(CATALOG_PAGE_SIZE),
    sort: params.sort,
  });

  if (params.q && params.q.trim().length > 0) {
    query.set("q", params.q.trim());
  }
  if (params.category && params.category.trim().length > 0) {
    query.set("category", params.category.trim());
  }
  if (params.cursor && params.cursor.trim().length > 0) {
    query.set("cursor", params.cursor.trim());
  }

  const endpoint = `/v1/catalog/products?${query.toString()}` as `/v1/${string}`;

  try {
    const raw = await serverApiFetch<unknown>(endpoint, {
      cache: "no-store",
    });
    return normalizeProductPage(raw);
  } catch (error) {
    // If the request included a cursor and failed with 400 (e.g. invalid cursor / tampered cursor),
    // recover gracefully by fetching the first page without the cursor.
    if (error instanceof ApiError && error.status === 400 && params.cursor) {
      console.warn(
        "Invalid catalog cursor encountered, recovering to first page without cursor.",
      );
      const fallback = await fetchCatalogProducts({
        ...params,
        cursor: undefined,
      });
      return {
        ...fallback,
        recoveredFromInvalidCursor: true,
      };
    }

    throw error;
  }
}
