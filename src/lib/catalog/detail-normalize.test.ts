import { describe, expect, it } from "vitest";

import { CatalogContractError } from "./normalize";
import { normalizeProductDetail } from "./detail-normalize";

const validProduct = {
  id: "prod-1",
  slug: "addis-chair",
  name: "Addis Chair",
  description: "A solid handcrafted chair.",
  category: { slug: "chairs", name: "Chairs" },
  company: { slug: "addis-craft", name: "Addis Craft" },
  price: { amount_minor: 450_000, currency: "ETB" },
  dimensions: { width_mm: 600, depth_mm: 650, height_mm: 850 },
  weight_g: 8_500,
  published_at: "2026-01-01T00:00:00Z",
  primary_image_url: "/v1/media/img-1",
  images: [
    {
      id: "img-2",
      kind: "image",
      url: "/v1/media/img-2",
      content_type: "image/webp",
      size_bytes: 2_048,
      width: 800,
      height: 600,
      alt_text: "Side view",
      position: 1,
      is_primary: false,
    },
    {
      id: "img-1",
      kind: "image",
      url: "/v1/media/img-1",
      content_type: "image/jpeg",
      size_bytes: 1_024,
      width: 800,
      height: 600,
      alt_text: "Front view",
      position: 2,
      is_primary: true,
    },
  ],
  model: {
    id: "model-1",
    kind: "model",
    url: "/v1/media/model-1",
    content_type: "model/gltf-binary",
    size_bytes: 4_096,
    position: 0,
    materials: ["fabric_grey", "fabric_blue"],
    variants: ["CHAIR-GREY", "CHAIR-BLUE"],
  },
  options: [
    {
      id: "option-colour",
      name: "Colour",
      position: 0,
      values: [
        {
          id: "value-blue",
          name: "Blue",
          position: 1,
          swatch_hex: "#0000FF",
          material_key: "fabric_blue",
        },
        {
          id: "value-grey",
          name: "Grey",
          position: 0,
          swatch_hex: "#808080",
          material_key: "fabric_grey",
        },
      ],
    },
  ],
  variants: [
    {
      id: "variant-blue",
      sku: "CHAIR-BLUE",
      price: { amount_minor: 480_000, currency: "ETB" },
      available: false,
      position: 1,
      options: { Colour: "Blue" },
      value_ids: ["value-blue"],
    },
    {
      id: "variant-grey",
      sku: "CHAIR-GREY",
      price: { amount_minor: 450_000, currency: "ETB" },
      available: true,
      position: 0,
      options: { Colour: "Grey" },
      value_ids: ["value-grey"],
    },
  ],
};

function rejects(value: unknown) {
  expect(() => normalizeProductDetail(value)).toThrow(CatalogContractError);
}

describe("normalizeProductDetail", () => {
  it("strictly normalizes and orders a complete product", () => {
    const result = normalizeProductDetail(validProduct);

    expect(result.formattedBasePrice.replace(/\u00a0/g, " ")).toBe(
      "ETB 4,500.00",
    );
    expect(result.formattedWeight).toBe("8.5 kg");
    expect(result.images.map((image) => image.id)).toEqual(["img-1", "img-2"]);
    expect(result.options[0]?.values.map((value) => value.id)).toEqual([
      "value-grey",
      "value-blue",
    ]);
    expect(result.variants.map((variant) => variant.sku)).toEqual([
      "CHAIR-GREY",
      "CHAIR-BLUE",
    ]);
    expect(result.model?.contentType).toBe("model/gltf-binary");
  });

  it("accepts a complete non-configurable product", () => {
    const result = normalizeProductDetail({
      ...validProduct,
      model: null,
      options: [],
      variants: [],
      weight_g: null,
    });
    expect(result.hasOptions).toBe(false);
    expect(result.formattedWeight).toBeNull();
  });

  it("requires every top-level collection and nullable field", () => {
    rejects(null);
    rejects({ ...validProduct, images: undefined });
    rejects({ ...validProduct, model: undefined });
    rejects({ ...validProduct, options: undefined });
    rejects({ ...validProduct, variants: undefined });
    rejects({ ...validProduct, weight_g: undefined });
    rejects({ ...validProduct, published_at: undefined });
    rejects({ ...validProduct, primary_image_url: undefined });
    rejects({ ...validProduct, description: undefined });
  });

  it("rejects invalid numbers, currency and availability", () => {
    rejects({ ...validProduct, weight_g: 1.5 });
    rejects({ ...validProduct, dimensions: { width_mm: 0, depth_mm: 1, height_mm: 1 } });
    rejects({ ...validProduct, price: { amount_minor: 1, currency: "etb" } });
    rejects({
      ...validProduct,
      variants: [{ ...validProduct.variants[1], available: "yes" }],
    });
    rejects({
      ...validProduct,
      variants: [
        {
          ...validProduct.variants[1],
          price: { amount_minor: 450_000, currency: "USD" },
        },
      ],
    });
  });

  it("rejects malformed media and primary-image mismatches", () => {
    rejects({
      ...validProduct,
      images: [{ ...validProduct.images[0], kind: "model" }],
    });
    rejects({
      ...validProduct,
      images: [validProduct.images[0], { ...validProduct.images[0] }],
    });
    rejects({ ...validProduct, primary_image_url: "/v1/media/missing" });
    rejects({
      ...validProduct,
      model: { ...validProduct.model, content_type: "application/json" },
    });
    rejects({
      ...validProduct,
      images: [{ ...validProduct.images[0], is_primary: undefined }],
    });
    rejects({
      ...validProduct,
      model: { ...validProduct.model, materials: undefined },
    });
  });

  it("rejects duplicate option, value, variant and SKU identities", () => {
    rejects({
      ...validProduct,
      options: [validProduct.options[0]!, { ...validProduct.options[0]! }],
    });
    rejects({
      ...validProduct,
      options: [
        {
          ...validProduct.options[0]!,
          values: [
            validProduct.options[0]!.values[0]!,
            { ...validProduct.options[0]!.values[0]! },
          ],
        },
      ],
    });
    rejects({
      ...validProduct,
      variants: [
        validProduct.variants[1]!,
        { ...validProduct.variants[0]!, id: validProduct.variants[1]!.id },
      ],
    });
    rejects({
      ...validProduct,
      variants: [
        validProduct.variants[1]!,
        { ...validProduct.variants[0]!, sku: validProduct.variants[1]!.sku },
      ],
    });
  });

  it("rejects unknown, incomplete and duplicate combinations", () => {
    rejects({
      ...validProduct,
      variants: [
        { ...validProduct.variants[1]!, value_ids: ["unknown-value"] },
      ],
    });
    rejects({
      ...validProduct,
      variants: [{ ...validProduct.variants[1]!, value_ids: [] }],
    });
    rejects({
      ...validProduct,
      variants: [
        validProduct.variants[1]!,
        {
          ...validProduct.variants[0]!,
          value_ids: validProduct.variants[1]!.value_ids,
          options: validProduct.variants[1]!.options,
        },
      ],
    });
  });

  it("rejects option display maps that disagree with selected IDs", () => {
    rejects({
      ...validProduct,
      variants: [
        {
          ...validProduct.variants[1],
          options: { Colour: "Blue" },
        },
      ],
    });
    rejects({
      ...validProduct,
      variants: [
        {
          ...validProduct.variants[1],
          options: { Colour: "Grey", Extra: "value" },
        },
      ],
    });
  });

  it("requires options and variants to appear together", () => {
    rejects({ ...validProduct, variants: [] });
    rejects({ ...validProduct, options: [] });
  });
});
