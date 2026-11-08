"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ProductImage } from "@/components/catalog/product-image";
import type { ProductDetail } from "@/lib/catalog/detail-types";
import { resolveVariant } from "@/lib/catalog/variant-resolver";
import { cn } from "@/lib/cn";

import { ProductGallery } from "./product-gallery";

const ProductPreview = dynamic(() => import("./product-preview"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[4/3] animate-pulse rounded-2xl border border-ink/10 bg-canvas-deep/40" role="status" aria-label="Loading 3D preview" />
  ),
});

type Mode = "photos" | "3d";

export function ProductMediaViewer({ product }: { product: ProductDetail }) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("photos");
  const [failure, setFailure] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const customerSelected = useRef(false);
  const hasModel = Boolean(product.model);
  const requestedSku = searchParams.get("variant");
  const selectedSku = useMemo(
    () => resolveVariant(product, requestedSku).selectedVariant?.sku ?? null,
    [product, requestedSku],
  );

  useEffect(() => {
    if (
      hasModel &&
      !customerSelected.current &&
      window.matchMedia("(min-width: 768px)").matches
    ) {
      setMode("3d");
    }
  }, [hasModel]);

  const selectMode = (nextMode: Mode) => {
    customerSelected.current = true;
    setMode(nextMode);
  };

  const fail = useCallback((message: string) => setFailure(message), []);
  const retry = async () => {
    if (!product.model) return;
    const { clearFailedModel, supportsWebGL2 } = await import("./product-preview");
    if (!supportsWebGL2()) {
      setFailure("WebGL2 is unavailable in this browser.");
      return;
    }
    clearFailedModel(product.model.url);
    setFailure(null);
    setRetryKey((value) => value + 1);
  };

  if (!product.model) {
    return <ProductGallery images={product.images} productName={product.name} />;
  }

  return (
    <section aria-label="Product media" data-testid="product-media-viewer">
      <div role="tablist" aria-label="Product media view" className="mb-4 inline-flex rounded-full border border-ink/10 bg-canvas-deep/40 p-1">
        {(["photos", "3d"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={mode === item}
            aria-controls={`product-${item}-panel`}
            id={`product-${item}-tab`}
            onClick={() => selectMode(item)}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta",
              mode === item ? "bg-canvas text-ink shadow-sm" : "text-ink-muted hover:text-ink",
            )}
          >
            {item === "photos" ? "Photos" : "3D view"}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id="product-photos-panel"
        aria-labelledby="product-photos-tab"
        hidden={mode !== "photos"}
      >
        <ProductGallery images={product.images} productName={product.name} />
      </div>

      <div
        role="tabpanel"
        id="product-3d-panel"
        aria-labelledby="product-3d-tab"
        hidden={mode !== "3d"}
      >
        {mode === "3d" && failure ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-ink/10 bg-canvas-deep/40" data-testid="preview-fallback">
            <ProductImage src={product.primaryImageUrl} alt={product.name} className="size-full object-cover opacity-35" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-canvas/75 p-6 text-center backdrop-blur-sm">
              <p className="font-medium text-ink">3D preview unavailable</p>
              <p className="max-w-sm text-xs text-ink/65">{failure}</p>
              <button type="button" onClick={() => void retry()} className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta" data-testid="retry-3d-preview">
                Retry 3D view
              </button>
            </div>
          </div>
        ) : mode === "3d" ? (
          <ProductPreview
            product={product}
            selectedSku={selectedSku}
            onFailure={fail}
            retryKey={retryKey}
          />
        ) : null}
      </div>
    </section>
  );
}
