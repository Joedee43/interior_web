import { describe, expect, it } from "vitest";

import type { ProductDetail } from "./detail-types";
import { buildProductJsonLd, sanitizeJsonLd } from "./json-ld";

const nonVariantProduct: ProductDetail = {
  id: "prod-sofa",
  slug: "nordic-sofa",
  name: "Nordic Sofa",
  description: "A comfortable 3-seat sofa",
  category: { slug: "sofas", name: "Sofas" },
  company: { slug: "nordic-design", name: "Nordic Design" },
  basePrice: { amount_minor: 1200000, currency: "ETB" },
  formattedBasePrice: "ETB 12,000.00",
  dimensions: { width_mm: 2000, depth_mm: 900, height_mm: 800 },
  formattedDimensions: "2000 × 900 × 800 mm",
  primaryImageUrl: "/v1/media/sofa.jpg",
  images: [
    {
      id: "img-1",
      url: "/v1/media/sofa.jpg",
      contentType: "image/jpeg",
      sizeBytes: 1_024,
      position: 1,
      isPrimary: true,
      altText: "Nordic Sofa",
    },
  ],
  model: null,
  hasOptions: false,
  options: [],
  variants: [],
};

const variantProduct: ProductDetail = {
  ...nonVariantProduct,
  id: "prod-chair",
  slug: "addis-chair",
  name: "Addis Chair",
  hasOptions: true,
  options: [
    {
      id: "opt-1",
      name: "Color",
      position: 1,
      values: [
        { id: "v-1", name: "Grey", position: 1 },
        { id: "v-2", name: "Blue", position: 2 },
      ],
    },
  ],
  variants: [
    {
      id: "var-1",
      sku: "CHAIR-GREY",
      price: { amount_minor: 450000, currency: "ETB" },
      formattedPrice: "ETB 4,500.00",
      available: true,
      position: 1,
      options: { Color: "Grey" },
      valueIds: ["v-1"],
    },
    {
      id: "var-2",
      sku: "CHAIR-BLUE",
      price: { amount_minor: 500000, currency: "ETB" },
      formattedPrice: "ETB 5,000.00",
      available: true,
      position: 2,
      options: { Color: "Blue" },
      valueIds: ["v-2"],
    },
  ],
};

describe("buildProductJsonLd", () => {
  it("builds single Offer structured data for products without options", () => {
    const jsonLd = buildProductJsonLd(
      nonVariantProduct,
      "https://example.com/products/nordic-design/nordic-sofa",
    );

    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.name).toBe("Nordic Sofa");
    expect(jsonLd.url).toBe(
      "https://example.com/products/nordic-design/nordic-sofa",
    );

    const offers = jsonLd.offers as Record<string, unknown>;
    expect(offers["@type"]).toBe("Offer");
    expect(offers.price).toBe(12000);
    expect(offers.priceCurrency).toBe("ETB");
    expect(offers.availability).toBe("https://schema.org/InStock");
    expect(jsonLd.image).toEqual(["https://example.com/v1/media/sofa.jpg"]);
  });

  it("uses each currency's actual minor-unit exponent", () => {
    const jpy = buildProductJsonLd(
      {
        ...nonVariantProduct,
        basePrice: { amount_minor: 500, currency: "JPY" },
      },
      "https://example.com/products/maker/item",
    );
    expect((jpy.offers as Record<string, unknown>).price).toBe(500);

    const kwd = buildProductJsonLd(
      {
        ...nonVariantProduct,
        basePrice: { amount_minor: 1_234, currency: "KWD" },
      },
      "https://example.com/products/maker/item",
    );
    expect((kwd.offers as Record<string, unknown>).price).toBe(1.234);
  });

  it("excludes unavailable variants from aggregate offers", () => {
    const jsonLd = buildProductJsonLd(
      {
        ...variantProduct,
        variants: [
          ...variantProduct.variants,
          {
            ...variantProduct.variants[1]!,
            id: "var-3",
            sku: "CHAIR-GONE",
            available: false,
          },
        ],
      },
      "https://example.com/products/maker/item",
    );
    const offers = jsonLd.offers as Record<string, unknown>;
    expect(offers.offerCount).toBe(2);
    expect(offers.offers).toHaveLength(2);
  });

  it("emits an out-of-stock offer when every variant is unavailable", () => {
    const jsonLd = buildProductJsonLd(
      {
        ...variantProduct,
        variants: variantProduct.variants.map((variant) => ({
          ...variant,
          available: false,
        })),
      },
      "https://example.com/products/maker/item",
    );
    expect(jsonLd.offers).toMatchObject({
      "@type": "Offer",
      availability: "https://schema.org/OutOfStock",
    });
  });

  it("builds AggregateOffer structured data for products with variants", () => {
    const jsonLd = buildProductJsonLd(
      variantProduct,
      "https://example.com/products/nordic-design/addis-chair",
    );

    expect(jsonLd["@type"]).toBe("Product");
    const agg = jsonLd.offers as Record<string, unknown>;
    expect(agg["@type"]).toBe("AggregateOffer");
    expect(agg.priceCurrency).toBe("ETB");
    expect(agg.lowPrice).toBe(4500);
    expect(agg.highPrice).toBe(5000);
    expect(agg.offerCount).toBe(2);

    const variantOffers = agg.offers as Array<Record<string, unknown>>;
    expect(variantOffers).toHaveLength(2);
    expect(variantOffers[0]?.sku).toBe("CHAIR-GREY");
    expect(variantOffers[0]?.price).toBe(4500);
    expect(variantOffers[0]?.url).toBe(
      "https://example.com/products/nordic-design/addis-chair?variant=CHAIR-GREY",
    );
  });
});

describe("sanitizeJsonLd", () => {
  it("escapes unsafe HTML characters to prevent XSS in script tags", () => {
    const data = {
      title: "</script><script>alert('xss')</script>",
      amp: "Tom & Jerry",
      arrow: "a < b > c",
    };

    const sanitized = sanitizeJsonLd(data);
    expect(sanitized).not.toContain("<");
    expect(sanitized).not.toContain(">");
    expect(sanitized).not.toContain("&");
    expect(sanitized).toContain("\\u003c/script\\u003e");
    expect(sanitized).toContain("Tom \\u0026 Jerry");
  });
});
