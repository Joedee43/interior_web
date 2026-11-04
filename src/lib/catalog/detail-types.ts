import type {
  CatalogCategory,
  CatalogProductDimensions,
  CatalogProductPrice,
} from "./types";

export interface ProductMediaImage {
  id: string;
  url: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  altText: string;
  width?: number;
  height?: number;
  position: number;
  isPrimary: boolean;
}

export interface ProductMediaModel {
  id: string;
  url: string;
  contentType: "model/gltf-binary";
  sizeBytes: number;
  position: number;
  materials: string[];
  variants: string[];
}

export interface ProductOptionValue {
  id: string;
  name: string;
  position: number;
  swatchHex?: string;
  materialKey?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  position: number;
  values: ProductOptionValue[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: CatalogProductPrice;
  formattedPrice: string;
  available: boolean;
  position: number;
  options: Record<string, string>;
  valueIds: string[];
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: CatalogCategory;
  company: {
    slug: string;
    name: string;
  };
  basePrice: CatalogProductPrice;
  formattedBasePrice: string;
  dimensions: CatalogProductDimensions;
  formattedDimensions: string;
  weightG?: number | null;
  formattedWeight?: string | null;
  publishedAt?: string | null;
  primaryImageUrl: string | null;
  images: ProductMediaImage[];
  model: ProductMediaModel | null;
  options: ProductOption[];
  variants: ProductVariant[];
  hasOptions: boolean;
}

export interface VariantResolution {
  selectedVariant: ProductVariant | null;
  isExactMatch: boolean;
  isCanonical: boolean;
  selectedOptionValueIds: Set<string>;
  disabledValueIds: Set<string>;
}
