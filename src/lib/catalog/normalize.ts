import { formatDimensions, formatPrice } from "./format";
import type {
  CatalogCategory,
  CatalogPage,
  CatalogProductCard,
} from "./types";

export class CatalogContractError extends Error {
  constructor(message: string) {
    super(`Invalid catalog response: ${message}`);
    this.name = "CatalogContractError";
  }
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new CatalogContractError(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

function nonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new CatalogContractError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function integer(value: unknown, field: string, minimum: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum) {
    throw new CatalogContractError(
      `${field} must be a safe integer greater than or equal to ${minimum}`,
    );
  }
  return value as number;
}

export function normalizeCategory(raw: unknown): CatalogCategory {
  const item = record(raw, "category");
  return {
    slug: nonEmptyString(item.slug, "category.slug"),
    name: nonEmptyString(item.name, "category.name"),
  };
}

export function normalizeCategories(raw: unknown): CatalogCategory[] {
  const response = record(raw, "categories response");
  if (!Array.isArray(response.categories)) {
    throw new CatalogContractError("categories must be an array");
  }
  return response.categories.map((category) => normalizeCategory(category));
}

export function normalizeProductCard(raw: unknown): CatalogProductCard {
  const item = record(raw, "product");
  const companyRaw = record(item.company, "product.company");
  const priceRaw = record(item.price, "product.price");
  const dimensionsRaw = record(item.dimensions, "product.dimensions");

  const currency = nonEmptyString(
    priceRaw.currency,
    "product.price.currency",
  );
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new CatalogContractError(
      "product.price.currency must be a three-letter uppercase code",
    );
  }

  const price = {
    amount_minor: integer(
      priceRaw.amount_minor,
      "product.price.amount_minor",
      0,
    ),
    currency,
  };
  const dimensions = {
    width_mm: integer(
      dimensionsRaw.width_mm,
      "product.dimensions.width_mm",
      1,
    ),
    depth_mm: integer(
      dimensionsRaw.depth_mm,
      "product.dimensions.depth_mm",
      1,
    ),
    height_mm: integer(
      dimensionsRaw.height_mm,
      "product.dimensions.height_mm",
      1,
    ),
  };

  let description: string | undefined;
  if (item.description !== undefined) {
    if (typeof item.description !== "string") {
      throw new CatalogContractError("product.description must be a string");
    }
    description = item.description.trim() || undefined;
  }

  let primaryImageUrl: string | null;
  if (item.primary_image_url === null) {
    primaryImageUrl = null;
  } else {
    primaryImageUrl = nonEmptyString(
      item.primary_image_url,
      "product.primary_image_url",
    );
  }

  return {
    id: nonEmptyString(item.id, "product.id"),
    slug: nonEmptyString(item.slug, "product.slug"),
    name: nonEmptyString(item.name, "product.name"),
    description,
    category: normalizeCategory(item.category),
    company: {
      slug: nonEmptyString(companyRaw.slug, "product.company.slug"),
      name: nonEmptyString(companyRaw.name, "product.company.name"),
    },
    price,
    formattedPrice: formatPrice(price),
    dimensions,
    formattedDimensions: formatDimensions(dimensions),
    primaryImageUrl,
  };
}

export function normalizeProductPage(raw: unknown): CatalogPage {
  const response = record(raw, "product page");
  if (!Array.isArray(response.products)) {
    throw new CatalogContractError("products must be an array");
  }

  let nextCursor: string | null;
  if (response.next_cursor === null) {
    nextCursor = null;
  } else if (
    typeof response.next_cursor === "string" &&
    response.next_cursor.length > 0
  ) {
    // Cursors are opaque. Do not trim, decode, or otherwise normalize them.
    nextCursor = response.next_cursor;
  } else {
    throw new CatalogContractError(
      "next_cursor must be a non-empty string or null",
    );
  }

  return {
    products: response.products.map((product) => normalizeProductCard(product)),
    nextCursor,
  };
}
