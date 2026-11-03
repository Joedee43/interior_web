import { formatDimensions, formatPrice } from "./format";
import type {
  CatalogCategory,
  CatalogPage,
  CatalogProductCard,
} from "./types";

export function normalizeCategory(raw: unknown): CatalogCategory | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const slug = typeof item.slug === "string" ? item.slug.trim() : "";
  const name = typeof item.name === "string" ? item.name.trim() : "";

  if (!slug || !name) {
    return null;
  }
  return { slug, name };
}

export function normalizeCategories(raw: unknown): CatalogCategory[] {
  if (typeof raw !== "object" || raw === null || !("categories" in raw)) {
    return [];
  }
  const list = (raw as { categories?: unknown }).categories;
  if (!Array.isArray(list)) {
    return [];
  }

  const result: CatalogCategory[] = [];
  for (const item of list) {
    const category = normalizeCategory(item);
    if (category) {
      result.push(category);
    }
  }
  return result;
}

export function normalizeProductCard(raw: unknown): CatalogProductCard | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;

  const id = typeof item.id === "string" ? item.id.trim() : "";
  const slug = typeof item.slug === "string" ? item.slug.trim() : "";
  const name = typeof item.name === "string" ? item.name.trim() : "";

  if (!id || !slug || !name) {
    return null;
  }

  const category = normalizeCategory(item.category) ?? {
    slug: "uncategorized",
    name: "Furniture",
  };

  const companyRaw = (item.company as Record<string, unknown>) ?? {};
  const company = {
    slug:
      typeof companyRaw.slug === "string" ? companyRaw.slug.trim() : "seller",
    name:
      typeof companyRaw.name === "string"
        ? companyRaw.name.trim()
        : "Independent Maker",
  };

  const priceRaw = (item.price as Record<string, unknown>) ?? {};
  const amountMinor =
    typeof priceRaw.amount_minor === "number" ? priceRaw.amount_minor : 0;
  const currency =
    typeof priceRaw.currency === "string" && priceRaw.currency.trim().length > 0
      ? priceRaw.currency.trim()
      : "ETB";

  const price = { amount_minor: amountMinor, currency };

  const dimRaw = (item.dimensions as Record<string, unknown>) ?? {};
  const dimensions = {
    width_mm: typeof dimRaw.width_mm === "number" ? dimRaw.width_mm : 0,
    depth_mm: typeof dimRaw.depth_mm === "number" ? dimRaw.depth_mm : 0,
    height_mm: typeof dimRaw.height_mm === "number" ? dimRaw.height_mm : 0,
  };

  const primaryImageUrl =
    typeof item.primary_image_url === "string" &&
    item.primary_image_url.trim().length > 0
      ? item.primary_image_url.trim()
      : null;

  const description =
    typeof item.description === "string" ? item.description.trim() : undefined;

  return {
    id,
    slug,
    name,
    description,
    category,
    company,
    price,
    formattedPrice: formatPrice(price),
    dimensions,
    formattedDimensions: formatDimensions(dimensions),
    primaryImageUrl,
  };
}

export function normalizeProductPage(raw: unknown): CatalogPage {
  if (typeof raw !== "object" || raw === null) {
    return { products: [], nextCursor: null };
  }
  const item = raw as Record<string, unknown>;
  const rawList = Array.isArray(item.products) ? item.products : [];

  const products: CatalogProductCard[] = [];
  for (const entry of rawList) {
    const card = normalizeProductCard(entry);
    if (card) {
      products.push(card);
    }
  }

  const nextCursor =
    typeof item.next_cursor === "string" && item.next_cursor.trim().length > 0
      ? item.next_cursor.trim()
      : null;

  return {
    products,
    nextCursor,
  };
}
