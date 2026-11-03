import type { ProductDetail } from "./detail-types";

/**
 * Builds schema.org Product JSON-LD structured data.
 * - Non-variant products use a single Offer.
 * - Variant products use an AggregateOffer composed from available variant prices.
 */
export function buildProductJsonLd(
  product: ProductDetail,
  canonicalUrl: string,
): Record<string, unknown> {
  const images = product.images.map((img) => img.url);
  if (product.primaryImageUrl && !images.includes(product.primaryImageUrl)) {
    images.unshift(product.primaryImageUrl);
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
    const majorPrice = product.basePrice.amount_minor / 100;
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
  const targetVariants =
    availableVariants.length > 0 ? availableVariants : product.variants;

  const prices = targetVariants.map((v) => v.price.amount_minor / 100);
  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);
  const currency = product.basePrice.currency;

  baseData.offers = {
    "@type": "AggregateOffer",
    priceCurrency: currency,
    lowPrice,
    highPrice,
    offerCount: targetVariants.length,
    offers: targetVariants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      price: v.price.amount_minor / 100,
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
