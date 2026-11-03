import { describe, expect, it } from "vitest";

import { formatDimensions, formatMoney, formatPrice } from "./format";

describe("formatMoney", () => {
  it("formats ETB minor units deterministically using en-ET locale", () => {
    const formatted = formatMoney(1250000, "ETB");
    // en-ET formats as "ETB 12,500.00" (using either regular or non-breaking space)
    expect(formatted.replace(/\u00a0/g, " ")).toBe("ETB 12,500.00");
  });

  it("handles zero amounts", () => {
    const formatted = formatMoney(0, "ETB");
    expect(formatted.replace(/\u00a0/g, " ")).toBe("ETB 0.00");
  });

  it("formats foreign currencies correctly according to their minor units", () => {
    const usd = formatMoney(12500, "USD");
    expect(usd.replace(/\u00a0/g, " ")).toBe("$125.00");

    const jpy = formatMoney(500, "JPY");
    expect(jpy.replace(/\u00a0/g, " ")).toBe("¥500");
  });

  it("defaults to ETB when currency is omitted", () => {
    const formatted = formatMoney(50000);
    expect(formatted.replace(/\u00a0/g, " ")).toBe("ETB 500.00");
  });
});

describe("formatPrice", () => {
  it("returns formatted price when price object is valid", () => {
    const formatted = formatPrice({ amount_minor: 750000, currency: "ETB" });
    expect(formatted.replace(/\u00a0/g, " ")).toBe("ETB 7,500.00");
  });

  it("returns fallback string when price object is missing or invalid", () => {
    expect(formatPrice(null)).toBe("Price on inquiry");
    expect(formatPrice(undefined)).toBe("Price on inquiry");
  });
});

describe("formatDimensions", () => {
  it("formats width, depth, height in millimetres as W × D × H mm", () => {
    expect(
      formatDimensions({
        width_mm: 1200,
        depth_mm: 800,
        height_mm: 750,
      }),
    ).toBe("1200 × 800 × 750 mm");
  });

  it("returns fallback text if dimensions are missing or incomplete", () => {
    expect(formatDimensions(null)).toBe("Dimensions unavailable");
    expect(formatDimensions(undefined)).toBe("Dimensions unavailable");
    expect(formatDimensions({ width_mm: 1200 })).toBe("Dimensions unavailable");
  });
});
