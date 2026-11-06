import { describe, expect, it } from "vitest";
import { normalizeDesignDetail, normalizeDesignPage, normalizeRoomTemplates } from "./normalize";

const id = "11111111-1111-4111-8111-111111111111";
const variantId = "22222222-2222-4222-8222-222222222222";
const room = { width_mm: 5000, depth_mm: 6000, height_mm: 2800 };
const features = { wall_color: "#FFFFFF", floor: "oak", openings: [] };
const summary = { id, name: "Living room", template_id: null, room, item_count: 1, created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-02T00:00:00Z" };
const item = {
  id: "33333333-3333-4333-8333-333333333333",
  position: { x_mm: 1600, y_mm: 0, z_mm: 1800 },
  rotation_deg: 30,
  available: true,
  product: {
    id: "44444444-4444-4444-8444-444444444444", slug: "chair", name: "Chair",
    company_slug: "maker", company_name: "Maker", variant_id: variantId, sku: "CHAIR-GREY",
    options: { Colour: "Grey" }, price: { amount_minor: 10000, currency: "ETB" },
    dimensions: { width_mm: 800, depth_mm: 800, height_mm: 900 },
    primary_image_url: "/v1/media/image", model_url: "/v1/media/model",
  },
  updated_at: "2026-11-02T00:00:00Z",
};
const detail = { ...summary, features, items: [item], estimate: { note: "Not a quote.", item_count: 1, unavailable_count: 0, totals: [{ company_slug: "maker", company_name: "Maker", currency: "ETB", amount_minor: 10000, items: 1 }] } };

describe("design normalization", () => {
  it("normalizes strict templates and full design detail", () => {
    expect(normalizeRoomTemplates({ templates: [{ id, slug: "living-room", name: "Living room", description: "Room", room, features, sort_order: 1, updated_at: "2026-11-01T00:00:00Z" }] })[0]?.features.floor).toBe("oak");
    const result = normalizeDesignDetail(detail);
    expect(result.items[0]?.product.sku).toBe("CHAIR-GREY");
    expect(result.items[0]?.position).toEqual({ xMm: 1600, yMm: 0, zMm: 1800 });
  });

  it("preserves opaque cursors byte-for-byte", () => {
    const cursor = "  opaque+cursor==  ";
    expect(normalizeDesignPage({ designs: [], next_cursor: cursor }).nextCursor).toBe(cursor);
  });

  it("rejects SKU/variant mismatches and inconsistent counts", () => {
    expect(() => normalizeDesignDetail({ ...detail, items: [{ ...item, product: { ...item.product, sku: null } }] })).toThrow(/variant_id and sku/);
    expect(() => normalizeDesignDetail({ ...detail, item_count: 2 })).toThrow(/item counts/);
  });

  it("rejects invalid dimensions, openings, currencies, rotations, and dates", () => {
    expect(() => normalizeDesignDetail({ ...detail, room: { ...room, width_mm: 999 } })).toThrow(/width_mm/);
    expect(() => normalizeDesignDetail({ ...detail, items: [{ ...item, rotation_deg: 360 }] })).toThrow(/rotation_deg/);
    expect(() => normalizeDesignDetail({ ...detail, items: [{ ...item, product: { ...item.product, price: { amount_minor: 1, currency: "etb" } } }] })).toThrow(/currency/);
    expect(() => normalizeDesignDetail({ ...detail, updated_at: "not-a-date" })).toThrow(/date-time/);
  });
});
