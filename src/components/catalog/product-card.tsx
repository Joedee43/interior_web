import Link from "next/link";
import type { CatalogProductCard as ProductCardType } from "@/lib/catalog/types";
import { ProductImage } from "./product-image";

interface ProductCardProps {
  product: ProductCardType;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-canvas transition-all hover:border-ink/25 hover:shadow-md focus-within:ring-2 focus-within:ring-terracotta"
      data-testid={`product-card-${product.id}`}
      aria-labelledby={`product-title-${product.id}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-canvas-deep/40">
        <ProductImage
          src={product.primaryImageUrl}
          alt={product.name}
        />
        <div className="absolute top-3 left-3">
          <span className="inline-block rounded-full border border-ink/10 bg-canvas/90 px-3 py-1 text-xs font-medium text-ink/80 backdrop-blur-sm">
            {product.category.name}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
            {product.company.name}
          </p>
          <h2
            id={`product-title-${product.id}`}
            className="mt-1 font-serif text-xl tracking-[-0.02em] text-ink transition-colors group-hover:text-terracotta"
          >
            <Link
              href={`/products/${product.company.slug}/${product.slug}`}
              className="after:absolute after:inset-0 focus:outline-none"
            >
              {product.name}
            </Link>
          </h2>
          {product.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/65">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-6 border-t border-ink/8 pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-ink-muted uppercase">
              From
            </span>
            <span className="font-serif text-lg font-semibold tracking-tight text-ink">
              {product.formattedPrice}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-ink-muted">
            <span>Dimensions</span>
            <span className="font-mono text-[0.8rem] text-ink/75">
              {product.formattedDimensions}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
