import { describe, expect, it } from "vitest";

import { normalizeProductDetail } from "./detail-normalize";

const validBase = {
  id: "prod-1",
  slug: "addis-chair",
  name: "Addis Chair",
  description: "A solid handcrafted chair.",
  category: {
    id: "cat-1",
    slug: "chairs",
    name: "Chairs",
  },
  company: {
    id: "co-1",
    slug: "addis-craft",
    name: "Addis Craft",
  },
  price: {
    amount_minor: 450000,
    currency: "ETB",
  },
  dimensions: {
    width_mm: 600,
    depth_mm: 650,
    height_mm: 850,
  },
  weight_g: 8500,
  published_at: "2026-01-01T00:00:00Z",
  primary_image_url: "https://example.com/img1.jpg",
  images: [
    {
      id: "img-2",
      url: "https://example.com/img2.jpg",
      position: 1,
      is_primary: false,
    },
    {
      id: "img-1",
      url: "https://example.com/img1.jpg",
      position: 2,
      is_primary: true,
    },
  ],
  model: {
    id: "mod-1",
    url: "https://example.com/model.glb",
    size_bytes: 1024,
    materials: ["wood", "fabric"],
    variants: ["grey", "blue"],
  },
  options: [
    {
      id: "opt-1",
      name: "Color",
      position: 1,
      values: [
        { id: "val-2", name: "Blue", position: 2, swatch_hex: "#0000ff" },
        { id: "val-1", name: "Grey", position: 1, swatch_hex: "#808080" },
      ],
    },
  ],
  variants: [
    {
      id: "var-2",
      sku: "CHAIR-BLUE",
      price: { amount_minor: 480000, currency: "ETB" },
      available: false,
      position: 2,
      options: { Color: "Blue" },
      value_ids: ["val-2"],
    },
    {
      id: "var-1",
      sku: "CHAIR-GREY",
      price: { amount_minor: 450000, currency: "ETB" },
      available: true,
      position: 1,
      options: { Color: "Grey" },
      value_ids: ["val-1"],
    },
  ],
};

describe("normalizeProductDetail", () => {
  it("normalizes a valid product with ordered media, options, and variants", () => {
    const result = normalizeProductDetail(validBase);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.id).toBe("prod-1");
    expect(result.slug).toBe("addis-chair");
    expect(result.name).toBe("Addis Chair");
    expect(result.company.name).toBe("Addis Craft");
    expect(result.formattedBasePrice.replace(/\u00a0/g, " ")).toBe(
      "ETB 4,500.00",
    );
    expect(result.formattedDimensions).toBe("600 × 650 × 850 mm");
    expect(result.formattedWeight).toBe("8.5 kg");
    expect(result.hasOptions).toBe(true);

    // Images sorted: primary first
    expect(result.images[0]?.id).toBe("img-1");
    expect(result.images[0]?.isPrimary).toBe(true);
    expect(result.images[1]?.id).toBe("img-2");

    // Option values sorted by position
    expect(result.options[0]?.values[0]?.id).toBe("val-1");
    expect(result.options[0]?.values[1]?.id).toBe("val-2");

    // Variants sorted by position
    expect(result.variants[0]?.sku).toBe("CHAIR-GREY");
    expect(result.variants[0]?.available).toBe(true);
    expect(result.variants[1]?.sku).toBe("CHAIR-BLUE");
    expect(result.variants[1]?.available).toBe(false);

    // Model normalized
    expect(result.model?.id).toBe("mod-1");
    expect(result.model?.materials).toEqual(["wood", "fabric"]);
  });

  it("normalizes a non-configurable product without options or variants", () => {
    const nonConfigurable = {
      ...validBase,
      options: [],
      variants: [],
      model: null,
      weight_g: null,
    };
    const result = normalizeProductDetail(nonConfigurable);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.hasOptions).toBe(false);
    expect(result.options).toHaveLength(0);
    expect(result.variants).toHaveLength(0);
    expect(result.model).toBeNull();
    expect(result.formattedWeight).toBeNull();
  });

  it("rejects when required top-level fields are missing or empty", () => {
    expect(normalizeProductDetail(null)).toBeNull();
    expect(normalizeProductDetail({})).toBeNull();
    expect(normalizeProductDetail({ ...validBase, id: "" })).toBeNull();
    expect(normalizeProductDetail({ ...validBase, slug: "" })).toBeNull();
    expect(normalizeProductDetail({ ...validBase, name: "" })).toBeNull();
    expect(normalizeProductDetail({ ...validBase, category: null })).toBeNull();
    expect(
      normalizeProductDetail({
        ...validBase,
        company: { slug: "", name: "" },
      }),
    ).toBeNull();
    expect(
      normalizeProductDetail({
        ...validBase,
        price: { amount_minor: -1, currency: "ETB" },
      }),
    ).toBeNull();
    expect(
      normalizeProductDetail({
        ...validBase,
        dimensions: { width_mm: 500 }, // missing depth and height
      }),
    ).toBeNull();
  });

  it("rejects invalid media objects missing id or url", () => {
    expect(
      normalizeProductDetail({
        ...validBase,
        images: [{ id: "", url: "https://example.com/img.jpg" }],
      }),
    ).toBeNull();

    expect(
      normalizeProductDetail({
        ...validBase,
        images: [{ id: "img-1", url: "" }],
      }),
    ).toBeNull();

    expect(
      normalizeProductDetail({
        ...validBase,
        model: { id: "", url: "https://example.com/mod.glb" },
      }),
    ).toBeNull();
  });

  it("rejects variants with unknown value IDs", () => {
    const invalid = {
      ...validBase,
      variants: [
        {
          id: "var-1",
          sku: "CHAIR-UNKNOWN",
          price: { amount_minor: 450000, currency: "ETB" },
          available: true,
          position: 1,
          value_ids: ["unknown-val-id"],
        },
      ],
    };
    expect(normalizeProductDetail(invalid)).toBeNull();
  });

  it("rejects incomplete variant combinations", () => {
    // 2 options defined, but variant only provides 1 value
    const twoOptions = {
      ...validBase,
      options: [
        {
          id: "opt-1",
          name: "Color",
          position: 1,
          values: [{ id: "val-1", name: "Grey", position: 1 }],
        },
        {
          id: "opt-2",
          name: "Material",
          position: 2,
          values: [{ id: "val-2", name: "Oak", position: 1 }],
        },
      ],
      variants: [
        {
          id: "var-1",
          sku: "CHAIR-INCOMPLETE",
          price: { amount_minor: 450000, currency: "ETB" },
          available: true,
          position: 1,
          value_ids: ["val-1"], // missing val-2 for opt-2
        },
      ],
    };
    expect(normalizeProductDetail(twoOptions)).toBeNull();
  });

  it("rejects duplicate variant combinations", () => {
    const duplicate = {
      ...validBase,
      variants: [
        {
          id: "var-1",
          sku: "CHAIR-GREY-1",
          price: { amount_minor: 450000, currency: "ETB" },
          available: true,
          position: 1,
          value_ids: ["val-1"],
        },
        {
          id: "var-2",
          sku: "CHAIR-GREY-2",
          price: { amount_minor: 460000, currency: "ETB" },
          available: true,
          position: 2,
          value_ids: ["val-1"], // duplicate combination!
        },
      ],
    };
    expect(normalizeProductDetail(duplicate)).toBeNull();
  });

  it("rejects products with options but no variants, or variants without options", () => {
    expect(
      normalizeProductDetail({
        ...validBase,
        options: [
          {
            id: "opt-1",
            name: "Color",
            position: 1,
            values: [{ id: "val-1", name: "Grey", position: 1 }],
          },
        ],
        variants: [],
      }),
    ).toBeNull();

    expect(
      normalizeProductDetail({
        ...validBase,
        options: [],
        variants: [
          {
            id: "var-1",
            sku: "CHAIR-ALONE",
            price: { amount_minor: 450000, currency: "ETB" },
            available: true,
            position: 1,
            value_ids: [],
          },
        ],
      }),
    ).toBeNull();
  });
});
