import type { DesignDetail, DesignItem } from "@/lib/design/types";

export interface QuoteReviewGroup { key: string; companySlug: string; companyName: string; currency: string; subtotalMinor: number; items: DesignItem[] }

export function buildQuoteReview(design: DesignDetail): { groups: QuoteReviewGroup[]; unavailable: DesignItem[] } {
  const groups = new Map<string, QuoteReviewGroup>();
  const unavailable: DesignItem[] = [];
  for (const item of design.items) {
    if (!item.available) { unavailable.push(item); continue; }
    const key = `${item.product.companySlug}:${item.product.price.currency}`;
    const group = groups.get(key) ?? { key, companySlug: item.product.companySlug, companyName: item.product.companyName, currency: item.product.price.currency, subtotalMinor: 0, items: [] };
    group.items.push(item); group.subtotalMinor += item.product.price.amountMinor; groups.set(key, group);
  }
  return { groups: [...groups.values()], unavailable };
}

export function quoteReviewFingerprint(design: DesignDetail): string {
  return design.items.map((item) => [item.id, item.updatedAt, item.available, item.product.variantId, item.product.price.amountMinor, item.product.price.currency].join(":" )).sort().join("|");
}

