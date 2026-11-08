"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function ProductImage({ src, alt, className }: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "grid size-full place-items-center bg-canvas-deep/70 p-6 text-center text-ink-muted",
          className,
        )}
        data-testid="product-image-fallback"
        role="img"
        aria-label={`${alt} (No image available)`}
      >
        <div className="flex flex-col items-center gap-2">
          <svg
            className="size-10 stroke-current stroke-[1.5]"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
          </svg>
          <span className="text-xs font-medium tracking-wide uppercase">
            Image pending
          </span>
        </div>
      </div>
    );
  }

  // Uses direct unoptimized same-origin media URL so rewrites to Go API function as intended.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={cn("size-full object-cover", className)}
      loading="lazy"
    />
  );
}
