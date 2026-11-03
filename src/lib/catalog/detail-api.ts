import "server-only";

import { cache } from "react";
import { ApiError } from "@/lib/api/error";
import type { operations } from "@/lib/api/generated/schema";
import { serverApiFetch } from "@/lib/api/server";
import { normalizeProductDetail } from "./detail-normalize";
import type { ProductDetail } from "./detail-types";

type ProductDetailResponse =
  operations["getCatalogProduct"]["responses"][200]["content"]["application/json"];

/**
 * Fetches and strictly normalizes a product detail by company slug and product slug.
 * Wrapped in React cache() so generateMetadata and page rendering share one request per render cycle.
 * Returns null if the backend returns a 404 response.
 */
export const getProductDetail = cache(
  async (
    companySlug: string,
    productSlug: string,
  ): Promise<ProductDetail | null> => {
    const cleanCompany = companySlug?.trim();
    const cleanProduct = productSlug?.trim();

    if (!cleanCompany || !cleanProduct) {
      return null;
    }

    const endpoint = `/v1/catalog/products/${encodeURIComponent(cleanCompany)}/${encodeURIComponent(cleanProduct)}` as `/v1/${string}`;

    try {
      const raw = await serverApiFetch<ProductDetailResponse>(endpoint, {
        cache: "no-store",
      });

      const normalized = normalizeProductDetail(raw);
      if (!normalized) {
        throw new Error("Invalid product detail response payload");
      }

      return normalized;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },
);
