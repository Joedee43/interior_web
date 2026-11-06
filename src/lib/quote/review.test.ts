import { describe, expect, it } from "vitest";
import { buildQuoteReview, quoteReviewFingerprint } from "./review";
import type { DesignDetail, DesignItem } from "@/lib/design/types";

const makeItem = (id: string, maker: string, currency: string, amount: number, available = true): DesignItem => ({ id, available, position: { xMm: 0, yMm: 0, zMm: 0 }, rotationDeg: 0, updatedAt: "2026-11-06T00:00:00Z", product: { id, slug: id, name: id, companySlug: maker, companyName: maker, variantId: null, sku: null, options: {}, price: { amountMinor: amount, currency }, dimensions: { widthMm: 1, depthMm: 1, heightMm: 1 }, primaryImageUrl: null, modelUrl: null } });
const design = { id: "design", items: [makeItem("one", "maker", "ETB", 100), makeItem("two", "maker", "ETB", 200), makeItem("three", "other", "USD", 50), makeItem("four", "maker", "ETB", 99, false)] } as DesignDetail;

describe("quote review", () => {
  it("groups available furniture by maker and currency", () => expect(buildQuoteReview(design)).toMatchObject({ groups: [{ companySlug: "maker", currency: "ETB", subtotalMinor: 300 }, { companySlug: "other", currency: "USD", subtotalMinor: 50 }], unavailable: [{ id: "four" }] }));
  it("fingerprints quote-relevant changes", () => expect(quoteReviewFingerprint({ ...design, items: [{ ...design.items[0]!, available: false }, ...design.items.slice(1)] })).not.toBe(quoteReviewFingerprint(design)));
});

