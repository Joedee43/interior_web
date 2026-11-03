export type CatalogSort = "newest" | "price_asc" | "price_desc";

export interface SortOption {
  value: CatalogSort;
  label: string;
}

export const CATALOG_SORTS: readonly SortOption[] = [
  { value: "newest", label: "Newest arrivals" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
] as const;

export const DEFAULT_CATALOG_SORT: CatalogSort = "newest";

export interface CatalogQueryParams {
  q?: string;
  category?: string;
  sort: CatalogSort;
  cursor?: string;
}

export interface CatalogCategory {
  slug: string;
  name: string;
}

export interface CatalogProductDimensions {
  width_mm: number;
  depth_mm: number;
  height_mm: number;
}

export interface CatalogProductPrice {
  amount_minor: number;
  currency: string;
}

export interface CatalogProductCard {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: CatalogCategory;
  company: {
    slug: string;
    name: string;
  };
  price: CatalogProductPrice;
  formattedPrice: string;
  dimensions: CatalogProductDimensions;
  formattedDimensions: string;
  primaryImageUrl: string | null;
}

export interface CatalogPage {
  products: CatalogProductCard[];
  nextCursor: string | null;
  recoveredFromInvalidCursor?: boolean;
}
