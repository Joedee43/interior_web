"use client";

import type { operations } from "@/lib/api/generated/schema";
import { browserApiFetch } from "@/lib/api/browser";
import { normalizeCategories, normalizeProductPage } from "@/lib/catalog/normalize";
import { normalizeProductDetail } from "@/lib/catalog/detail-normalize";
import type { CatalogPage } from "@/lib/catalog/types";
import type { ProductDetail } from "@/lib/catalog/detail-types";

type CategoriesResponse = operations["listCategories"]["responses"][200]["content"]["application/json"];
type ProductsResponse = operations["listCatalogProducts"]["responses"][200]["content"]["application/json"];
type ProductResponse = operations["getCatalogProduct"]["responses"][200]["content"]["application/json"];

export async function fetchEditorCategories() {
  return normalizeCategories(await browserApiFetch<CategoriesResponse>("/v1/catalog/categories"));
}
export async function fetchEditorProducts(q: string, category: string, cursor?: string): Promise<CatalogPage> {
  const query = new URLSearchParams({ limit: "20", sort: "newest" });
  if (q.trim()) query.set("q", q.trim());
  if (category) query.set("category", category);
  if (cursor !== undefined) query.set("cursor", cursor);
  return normalizeProductPage(await browserApiFetch<ProductsResponse>(`/v1/catalog/products?${query}` as `/v1/${string}`));
}
export async function fetchEditorProduct(company: string, product: string): Promise<ProductDetail> {
  return normalizeProductDetail(await browserApiFetch<ProductResponse>(`/v1/catalog/products/${encodeURIComponent(company)}/${encodeURIComponent(product)}` as `/v1/${string}`));
}
