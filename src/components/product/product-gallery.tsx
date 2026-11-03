"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

import { ProductImage } from "@/components/catalog/product-image";
import type { ProductMediaImage } from "@/lib/catalog/detail-types";
import { cn } from "@/lib/cn";

interface ProductGalleryProps {
  images: ProductMediaImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // If no images exist, show empty fallback
  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-ink/10 bg-canvas-deep/40">
        <ProductImage src={null} alt={productName} />
      </div>
    );
  }

  const activeImage = images[selectedIndex] ?? images[0];
  if (!activeImage) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-ink/10 bg-canvas-deep/40">
        <ProductImage src={null} alt={productName} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="product-gallery">
      {/* Primary Image with Dialog Trigger */}
      <Dialog.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-ink/10 bg-canvas-deep/40">
          <ProductImage
            src={activeImage.url}
            alt={activeImage.altText || productName}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />

          <Dialog.Trigger asChild>
            <button
              type="button"
              className="absolute inset-0 flex items-end justify-end p-4 text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-inset"
              aria-label={`Enlarge image: ${activeImage.altText || productName}`}
              data-testid="gallery-enlarge-trigger"
            >
              <span className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-canvas/85 px-3 py-1.5 text-xs font-medium text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-canvas">
                <svg
                  className="size-3.5 stroke-current stroke-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6"
                  />
                </svg>
                Enlarge
              </span>
            </button>
          </Dialog.Trigger>
        </div>

        {/* Radix Dialog Lightbox Modal */}
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-sm transition-opacity" />
          <Dialog.Content
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-8 outline-none"
            aria-describedby="dialog-description"
          >
            <Dialog.Title className="sr-only">
              {activeImage.altText || productName}
            </Dialog.Title>
            <p id="dialog-description" className="sr-only">
              Enlarged image view for {productName}
            </p>

            <div className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl bg-canvas shadow-2xl">
              <ProductImage
                src={activeImage.url}
                alt={activeImage.altText || productName}
                className="max-h-[85vh] max-w-[90vw] object-contain"
              />

              <Dialog.Close asChild>
                <button
                  type="button"
                  className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full border border-ink/10 bg-canvas/90 text-ink shadow-md backdrop-blur-sm transition-colors hover:bg-canvas hover:text-terracotta focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                  aria-label="Close enlarged view"
                  data-testid="gallery-dialog-close"
                >
                  <svg
                    className="size-5 stroke-current stroke-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div
          role="group"
          aria-label="Product image thumbnails"
          className="flex flex-wrap gap-2.5"
          data-testid="gallery-thumbnails"
        >
          {images.map((image, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-pressed={isSelected}
                aria-label={`View image ${index + 1} of ${images.length}: ${image.altText || productName}`}
                className={cn(
                  "relative aspect-square w-16 sm:w-20 overflow-hidden rounded-xl border bg-canvas-deep/30 transition-all",
                  isSelected
                    ? "border-terracotta ring-2 ring-terracotta/40 ring-offset-2 ring-offset-canvas"
                    : "border-ink/10 opacity-70 hover:opacity-100",
                )}
                data-testid={`gallery-thumb-${index}`}
              >
                <ProductImage
                  src={image.url}
                  alt=""
                  className="size-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
