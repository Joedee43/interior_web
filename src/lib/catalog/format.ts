import type { CatalogProductDimensions, CatalogProductPrice } from "./types";

/**
 * Formats a minor-unit monetary amount (e.g. cents, santim) deterministically
 * using the en-ET locale.
 *
 * @param amountMinor - The integer minor unit value (e.g. 1250000 for 12,500.00 ETB)
 * @param currency - 3-letter ISO currency code (defaults to "ETB")
 */
export function formatMoney(
  amountMinor: number,
  currency: string = "ETB",
): string {
  const normCurrency = (currency || "ETB").trim().toUpperCase();
  const fractionDigits = getCurrencyFractionDigits(normCurrency);
  const majorAmount = amountMinor / Math.pow(10, fractionDigits);

  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: normCurrency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(majorAmount);
}

export function formatPrice(price?: CatalogProductPrice | null): string {
  if (!price || typeof price.amount_minor !== "number") {
    return "Price on inquiry";
  }
  return formatMoney(price.amount_minor, price.currency);
}

/**
 * Formats width, depth, and height in millimetres as "W × D × H mm".
 */
export function formatDimensions(
  dimensions?: Partial<CatalogProductDimensions> | null,
): string {
  if (
    !dimensions ||
    typeof dimensions.width_mm !== "number" ||
    typeof dimensions.depth_mm !== "number" ||
    typeof dimensions.height_mm !== "number"
  ) {
    return "Dimensions unavailable";
  }

  return `${dimensions.width_mm} × ${dimensions.depth_mm} × ${dimensions.height_mm} mm`;
}

function getCurrencyFractionDigits(currency: string): number {
  try {
    const formatter = new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency,
    });
    return formatter.resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}
