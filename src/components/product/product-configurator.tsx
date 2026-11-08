"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

import type { ProductDetail } from "@/lib/catalog/detail-types";
import {
  resolveVariant,
  selectOptionValue,
} from "@/lib/catalog/variant-resolver";
import { cn } from "@/lib/cn";

interface ProductConfiguratorProps {
  product: ProductDetail;
}

export function ProductConfigurator({ product }: ProductConfiguratorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedSku = searchParams.get("variant");

  const resolution = useMemo(() => {
    return resolveVariant(product, requestedSku);
  }, [product, requestedSku]);

  const {
    selectedVariant,
    isCanonical,
    selectedOptionValueIds,
    disabledValueIds,
  } = resolution;

  // Unknown SKUs fall back to the default and are replaced with the canonical selected SKU
  useEffect(() => {
    if (!isCanonical && selectedVariant) {
      router.replace(
        `${pathname}?variant=${encodeURIComponent(selectedVariant.sku)}`,
        { scroll: false },
      );
    }
  }, [isCanonical, selectedVariant, pathname, router]);

  if (!product.hasOptions || product.options.length === 0) {
    return null;
  }

  const handleValueSelect = (valueId: string) => {
    const nextVariant = selectOptionValue(product, selectedVariant, valueId);
    if (nextVariant && nextVariant.sku !== selectedVariant?.sku) {
      router.replace(
        `${pathname}?variant=${encodeURIComponent(nextVariant.sku)}`,
        { scroll: false },
      );
    }
  };

  return (
    <div className="flex flex-col gap-6" data-testid="product-configurator">
      {/* Price & SKU & Availability Header */}
      <div className="flex flex-col gap-2 border-b border-ink/10 pb-5">
        <div className="flex items-baseline justify-between gap-4">
          <span
            className="font-serif text-3xl font-semibold tracking-tight text-ink"
            data-testid="selected-variant-price"
          >
            {selectedVariant?.formattedPrice ?? product.formattedBasePrice}
          </span>

          {selectedVariant && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-wide",
                selectedVariant.available
                  ? "bg-moss/10 text-moss"
                  : "bg-terracotta/15 text-terracotta",
              )}
              data-testid="selected-variant-availability"
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  selectedVariant.available ? "bg-moss" : "bg-terracotta",
                )}
                aria-hidden="true"
              />
              {selectedVariant.available ? "In stock" : "Currently unavailable"}
            </span>
          )}
        </div>

        {selectedVariant && (
          <p
            className="font-mono text-xs text-ink-muted"
            data-testid="selected-variant-sku"
          >
            SKU: <span className="text-ink/80">{selectedVariant.sku}</span>
          </p>
        )}
      </div>

      {/* Options and Values Selection */}
      <div className="flex flex-col gap-5">
        {product.options.map((option) => {
          const selectedValue = option.values.find((val) =>
            selectedOptionValueIds.has(val.id),
          );

          return (
            <fieldset key={option.id} className="flex flex-col gap-2.5">
              <legend className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase text-ink/70">
                <span>{option.name}:</span>
                {selectedValue && (
                  <span className="font-normal text-ink capitalize">
                    {selectedValue.name}
                  </span>
                )}
              </legend>

              <div
                className="flex flex-wrap gap-2.5"
                role="radiogroup"
                aria-label={option.name}
              >
                {option.values.map((val) => {
                  const isSelected = selectedOptionValueIds.has(val.id);
                  const isDisabled = disabledValueIds.has(val.id);

                  return (
                    <button
                      key={val.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-disabled={isDisabled}
                      disabled={isDisabled}
                      onClick={() => handleValueSelect(val.id)}
                      className={cn(
                        "group relative flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta",
                        isSelected
                          ? "border-terracotta bg-terracotta/10 text-ink ring-1 ring-terracotta"
                          : isDisabled
                            ? "cursor-not-allowed border-ink/10 bg-canvas-deep/20 text-ink/35 line-through opacity-50"
                            : "border-ink/15 bg-canvas text-ink/80 hover:border-ink/30 hover:bg-canvas-deep/30",
                      )}
                      data-testid={`option-value-${val.id}`}
                    >
                      {val.swatchHex && (
                        <span
                          className="size-3.5 rounded-full border border-ink/20 shadow-xs"
                          style={{ backgroundColor: val.swatchHex }}
                          aria-hidden="true"
                        />
                      )}
                      <span>{val.name}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}
