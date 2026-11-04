import type { ProductDetail } from "./detail-types";
import { minorToMajor } from "./format";

/**
 * Builds schema.org Product JSON-LD structured data.
 * - Non-variant products use a single Offer.
 * - Variant products use an AggregateOffer composed from available variant prices.
 */
export function buildProductJsonLd(
  product: ProductDetail,
  canonicalUrl: string,
): Record<string, unknown> {
  const images = product.images.map((img) =>
    new URL(img.url, canonicalUrl).toString(),
  );
  if (product.primaryImageUrl && !images.includes(product.primaryImageUrl)) {
    const primaryImage = new URL(product.primaryImageUrl, canonicalUrl).toString();
    if (!images.includes(primaryImage)) images.unshift(primaryImage);
  }

  const baseData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} by ${product.company.name}`,
    image: images.length > 0 ? images : undefined,
    url: canonicalUrl,
    brand: {
      "@type": "Brand",
      name: product.company.name,
    },
    category: product.category.name,
  };

  if (!product.hasOptions || product.variants.length === 0) {
    // Single Offer for non-variant products
    const majorPrice = minorToMajor(
      product.basePrice.amount_minor,
      product.basePrice.currency,
    );
    baseData.offers = {
      "@type": "Offer",
      price: majorPrice,
      priceCurrency: product.basePrice.currency,
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
    };
    return baseData;
  }

  // AggregateOffer for configurable products
  const availableVariants = product.variants.filter((v) => v.available);
  if (availableVariants.length === 0) {
    baseData.offers = {
      "@type": "Offer",
      price: minorToMajor(
        product.basePrice.amount_minor,
        product.basePrice.currency,
      ),
      priceCurrency: product.basePrice.currency,
      availability: "https://schema.org/OutOfStock",
      url: canonicalUrl,
    };
    return baseData;
  }

  const prices = availableVariants.map((variant) =>
    minorToMajor(variant.price.amount_minor, variant.price.currency),
  );
  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);
  const currency = product.basePrice.currency;

  baseData.offers = {
    "@type": "AggregateOffer",
    priceCurrency: currency,
    lowPrice,
    highPrice,
    offerCount: availableVariants.length,
    offers: availableVariants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      price: minorToMajor(v.price.amount_minor, v.price.currency),
      priceCurrency: v.price.currency,
      availability: v.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${canonicalUrl}?variant=${encodeURIComponent(v.sku)}`,
    })),
  };

  return baseData;
}

/**
 * Sanitizes JSON-LD output for safe inline embedding in HTML <script> tags,
 * escaping HTML sensitive characters (<, >, &, \u2028, \u2029).
 */
export function sanitizeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
