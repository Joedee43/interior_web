import { describe, expect, it } from "vitest";

import type { ProductDetail, ProductVariant } from "./detail-types";
import {
  getDefaultVariant,
  resolveVariant,
  selectOptionValue,
} from "./variant-resolver";

const mockVariants: ProductVariant[] = [
  {
    id: "v-1",
    sku: "CHAIR-GREY-OAK",
    price: { amount_minor: 450000, currency: "ETB" },
    formattedPrice: "ETB 4,500.00",
    available: true,
    position: 1,
    options: { Color: "Grey", Material: "Oak" },
    valueIds: ["val-grey", "val-oak"],
  },
  {
    id: "v-2",
    sku: "CHAIR-GREY-STEEL",
    price: { amount_minor: 480000, currency: "ETB" },
    formattedPrice: "ETB 4,800.00",
    available: false, // unavailable
    position: 2,
    options: { Color: "Grey", Material: "Steel" },
    valueIds: ["val-grey", "val-steel"],
  },
  {
    id: "v-3",
    sku: "CHAIR-BLUE-OAK",
    price: { amount_minor: 460000, currency: "ETB" },
    formattedPrice: "ETB 4,600.00",
    available: true,
    position: 3,
    options: { Color: "Blue", Material: "Oak" },
    valueIds: ["val-blue", "val-oak"],
  },
  {
    id: "v-4",
    sku: "CHAIR-BLUE-STEEL",
    price: { amount_minor: 490000, currency: "ETB" },
    formattedPrice: "ETB 4,900.00",
    available: true,
    position: 4,
    options: { Color: "Blue", Material: "Steel" },
    valueIds: ["val-blue", "val-steel"],
  },
];

const mockProduct: ProductDetail = {
  id: "prod-1",
  slug: "lounge-chair",
  name: "Lounge Chair",
  category: { slug: "chairs", name: "Chairs" },
  company: { slug: "demo", name: "Demo" },
  basePrice: { amount_minor: 450000, currency: "ETB" },
  formattedBasePrice: "ETB 4,500.00",
  dimensions: { width_mm: 600, depth_mm: 600, height_mm: 800 },
  formattedDimensions: "600 × 600 × 800 mm",
  primaryImageUrl: null,
  images: [],
  model: null,
  hasOptions: true,
  options: [
    {
      id: "opt-color",
      name: "Color",
      position: 1,
      values: [
        { id: "val-grey", name: "Grey", position: 1 },
        { id: "val-blue", name: "Blue", position: 2 },
      ],
    },
    {
      id: "opt-mat",
      name: "Material",
      position: 2,
      values: [
        { id: "val-oak", name: "Oak", position: 1 },
        { id: "val-steel", name: "Steel", position: 2 },
      ],
    },
  ],
  variants: mockVariants,
};

describe("getDefaultVariant", () => {
  it("returns the first available variant by position", () => {
    const def = getDefaultVariant(mockVariants);
    expect(def?.sku).toBe("CHAIR-GREY-OAK");
  });

  it("returns the first variant if all variants are unavailable", () => {
    const allUnavailable = mockVariants.map((v) => ({ ...v, available: false }));
    const def = getDefaultVariant(allUnavailable);
    expect(def?.sku).toBe("CHAIR-GREY-OAK");
  });

  it("returns null if variants list is empty", () => {
    expect(getDefaultVariant([])).toBeNull();
  });
});

describe("resolveVariant", () => {
  it("resolves default variant when no SKU requested", () => {
    const res = resolveVariant(mockProduct, undefined);
    expect(res.selectedVariant?.sku).toBe("CHAIR-GREY-OAK");
    expect(res.isExactMatch).toBe(false);
    expect(res.isCanonical).toBe(true);
    expect(res.selectedOptionValueIds).toEqual(
      new Set(["val-grey", "val-oak"]),
    );
  });

  it("resolves requested SKU exactly with case sensitivity", () => {
    const res = resolveVariant(mockProduct, "CHAIR-BLUE-STEEL");
    expect(res.selectedVariant?.sku).toBe("CHAIR-BLUE-STEEL");
    expect(res.isExactMatch).toBe(true);
    expect(res.isCanonical).toBe(true);

    // Case mismatch must NOT match
    const lower = resolveVariant(mockProduct, "chair-blue-steel");
    expect(lower.selectedVariant?.sku).toBe("CHAIR-GREY-OAK");
    expect(lower.isExactMatch).toBe(false);
    expect(lower.isCanonical).toBe(false);

    const padded = resolveVariant(mockProduct, " CHAIR-BLUE-STEEL ");
    expect(padded.selectedVariant?.sku).toBe("CHAIR-GREY-OAK");
    expect(padded.isCanonical).toBe(false);
  });

  it("keeps valid unavailable SKU selected and marked unavailable", () => {
    const res = resolveVariant(mockProduct, "CHAIR-GREY-STEEL");
    expect(res.selectedVariant?.sku).toBe("CHAIR-GREY-STEEL");
    expect(res.selectedVariant?.available).toBe(false);
    expect(res.isExactMatch).toBe(true);
    expect(res.isCanonical).toBe(true);
  });

  it("handles unknown SKU by falling back to default and setting isCanonical = false", () => {
    const res = resolveVariant(mockProduct, "DOES-NOT-EXIST");
    expect(res.selectedVariant?.sku).toBe("CHAIR-GREY-OAK");
    expect(res.isExactMatch).toBe(false);
    expect(res.isCanonical).toBe(false);
  });

  it("calculates disabled values and preserves values of current unavailable variant", () => {
    // Suppose val-copper only exists in an unavailable variant
    const productWithUnavailableValue: ProductDetail = {
      ...mockProduct,
      options: [
        {
          id: "opt-mat",
          name: "Material",
          position: 1,
          values: [
            { id: "val-oak", name: "Oak", position: 1 },
            { id: "val-copper", name: "Copper", position: 2 },
          ],
        },
      ],
      variants: [
        {
          id: "v-avail",
          sku: "CHAIR-OAK",
          price: { amount_minor: 450000, currency: "ETB" },
          formattedPrice: "ETB 4,500.00",
          available: true,
          position: 1,
          options: { Material: "Oak" },
          valueIds: ["val-oak"],
        },
        {
          id: "v-unavail",
          sku: "CHAIR-COPPER",
          price: { amount_minor: 480000, currency: "ETB" },
          formattedPrice: "ETB 4,800.00",
          available: false,
          position: 2,
          options: { Material: "Copper" },
          valueIds: ["val-copper"],
        },
      ],
    };

    // When Oak is selected, Copper has no available variant, so Copper is disabled
    const resOak = resolveVariant(productWithUnavailableValue, "CHAIR-OAK");
    expect(resOak.disabledValueIds.has("val-copper")).toBe(true);

    // When the unavailable Copper variant is selected, its own value is NOT disabled
    const resCopper = resolveVariant(productWithUnavailableValue, "CHAIR-COPPER");
    expect(resCopper.disabledValueIds.has("val-copper")).toBe(false);
  });

  it("handles products without options gracefully", () => {
    const simpleProduct: ProductDetail = {
      ...mockProduct,
      hasOptions: false,
      options: [],
      variants: [],
    };
    const res = resolveVariant(simpleProduct, "SOME-SKU");
    expect(res.selectedVariant).toBeNull();
    expect(res.isCanonical).toBe(true);
    expect(res.disabledValueIds.size).toBe(0);
  });
});

describe("selectOptionValue", () => {
  it("preserves as many current selections as possible when picking a variant", () => {
    // Currently at CHAIR-GREY-OAK (Grey, Oak)
    // User clicks "Blue" -> should pick CHAIR-BLUE-OAK (preserves Oak), not CHAIR-BLUE-STEEL
    const current = mockVariants[0]!; // CHAIR-GREY-OAK
    const next = selectOptionValue(mockProduct, current, "val-blue");
    expect(next?.sku).toBe("CHAIR-BLUE-OAK");
  });

  it("uses variant position as tie-breaker", () => {
    // Current has nothing in common with either option
    const current = mockVariants[0]!; // Grey, Oak
    // If user clicks a value where two candidates have 0 matches with current, lowest position wins
    const next = selectOptionValue(mockProduct, current, "val-blue");
    expect(next?.position).toBe(3); // CHAIR-BLUE-OAK is pos 3, CHAIR-BLUE-STEEL is pos 4
  });

  it("does not select an unavailable value through an ordinary option change", () => {
    const productUnavailable: ProductDetail = {
      ...mockProduct,
      variants: [
        {
          ...mockVariants[1]!, // CHAIR-GREY-STEEL (val-grey, val-steel)
          available: false,
        },
      ],
    };
    const next = selectOptionValue(productUnavailable, null, "val-steel");
    expect(next).toBeNull();
  });

  it("preserves the current unavailable selection when its selected value is activated", () => {
    const current = mockVariants[1]!;
    expect(selectOptionValue(mockProduct, current, "val-steel")).toBe(current);
  });
});
