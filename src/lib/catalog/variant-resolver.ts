import type {
  ProductDetail,
  ProductVariant,
  VariantResolution,
} from "./detail-types";

/**
 * Resolves which variant should be selected for a given product and SKU parameter.
 * - SKU matching is strictly case-sensitive.
 * - If requested SKU is missing or unknown, falls back to the first available variant by position,
 *   or the first variant if all are unavailable.
 * - Unknown SKUs set isCanonical = false to trigger a URL replacement with the canonical SKU.
 * - Disabled values are those with no available matching variant, except values of the currently displayed
 *   unavailable SKU.
 */
export function resolveVariant(
  product: ProductDetail,
  requestedSku?: string | null,
): VariantResolution {
  if (!product.hasOptions || product.variants.length === 0) {
    return {
      selectedVariant: null,
      isExactMatch: false,
      isCanonical: true,
      selectedOptionValueIds: new Set(),
      disabledValueIds: new Set(),
    };
  }

  const cleanSku = requestedSku?.trim();
  let selectedVariant: ProductVariant | null = null;
  let isExactMatch = false;
  let isCanonical = true;

  if (cleanSku) {
    const match = product.variants.find((v) => v.sku === cleanSku);
    if (match) {
      selectedVariant = match;
      isExactMatch = true;
      isCanonical = true;
    } else {
      // Unknown SKU: fallback to default variant, mark as non-canonical
      selectedVariant = getDefaultVariant(product.variants);
      isExactMatch = false;
      isCanonical = false;
    }
  } else {
    // No SKU requested: use default variant
    selectedVariant = getDefaultVariant(product.variants);
    isExactMatch = false;
    isCanonical = true;
  }

  const selectedOptionValueIds = new Set(selectedVariant?.valueIds ?? []);

  // Compute disabled values
  // Option values with no available matching variant are disabled,
  // EXCEPT values belonging to the currently displayed unavailable SKU.
  const disabledValueIds = new Set<string>();
  const availableValueIds = new Set<string>();

  for (const variant of product.variants) {
    if (variant.available) {
      for (const valId of variant.valueIds) {
        availableValueIds.add(valId);
      }
    }
  }

  for (const option of product.options) {
    for (const val of option.values) {
      const hasAvailableVariant = availableValueIds.has(val.id);
      if (!hasAvailableVariant) {
        const belongsToCurrentUnavailable =
          selectedVariant &&
          !selectedVariant.available &&
          selectedOptionValueIds.has(val.id);

        if (!belongsToCurrentUnavailable) {
          disabledValueIds.add(val.id);
        }
      }
    }
  }

  return {
    selectedVariant,
    isExactMatch,
    isCanonical,
    selectedOptionValueIds,
    disabledValueIds,
  };
}

/**
 * Returns the default variant: first available variant by position,
 * or the first variant if all variants are unavailable.
 */
export function getDefaultVariant(
  variants: ProductVariant[],
): ProductVariant | null {
  if (variants.length === 0) {
    return null;
  }
  const firstAvailable = variants.find((v) => v.available);
  return firstAvailable ?? variants[0] ?? null;
}

/**
 * Deterministically chooses the best variant containing targetValueId that preserves
 * the most current selections, with variant position as the tie-breaker.
 */
export function selectOptionValue(
  product: ProductDetail,
  currentVariant: ProductVariant | null,
  targetValueId: string,
): ProductVariant | null {
  if (!product.hasOptions || product.variants.length === 0) {
    return null;
  }

  // Look for available variants containing the target value
  let candidates = product.variants.filter(
    (v) => v.available && v.valueIds.includes(targetValueId),
  );

  // If no available variants exist, fall back to any variant containing the target value
  if (candidates.length === 0) {
    candidates = product.variants.filter((v) =>
      v.valueIds.includes(targetValueId),
    );
  }

  if (candidates.length === 0) {
    return currentVariant;
  }

  const currentValues = new Set(currentVariant?.valueIds ?? []);

  // Score each candidate by number of shared selections with current variant
  candidates.sort((a, b) => {
    const aShared = a.valueIds.filter((id) => currentValues.has(id)).length;
    const bShared = b.valueIds.filter((id) => currentValues.has(id)).length;

    if (bShared !== aShared) {
      return bShared - aShared; // Higher score first
    }
    return a.position - b.position; // Lowest position as tie-breaker
  });

  return candidates[0] ?? null;
}
