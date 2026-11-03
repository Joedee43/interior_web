import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogEmpty } from "@/components/catalog/catalog-empty";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogPagination } from "@/components/catalog/catalog-pagination";
import { ProductCard } from "@/components/catalog/product-card";
import { fetchCatalogCategories, fetchCatalogProducts } from "@/lib/catalog/api";
import { parseCatalogParams } from "@/lib/catalog/query";

interface CatalogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: CatalogPageProps): Promise<Metadata> {
  const resolved = await searchParams;
  const params = parseCatalogParams(resolved);

  let title = "Furniture Catalog · Interior";
  if (params.q) {
    title = `"${params.q}" · Furniture Catalog · Interior`;
  } else if (params.category) {
    title = `${params.category} · Furniture Catalog · Interior`;
  }

  return {
    title,
    description:
      "Explore configurable furniture designed by independent makers, scaled in real millimetres for your room.",
  };
}

async function CatalogContent({ searchParams }: CatalogPageProps) {
  const resolved = await searchParams;
  const params = parseCatalogParams(resolved);

  const [categories, catalogPage] = await Promise.all([
    fetchCatalogCategories(),
    fetchCatalogProducts(params),
  ]);

  const { products, nextCursor, recoveredFromInvalidCursor } = catalogPage;

  return (
    <>
      {/* Recovered from expired/invalid cursor notice */}
      {recoveredFromInvalidCursor && (
        <div
          role="status"
          className="mb-8 rounded-xl border border-terracotta/30 bg-terracotta/10 px-5 py-3 text-sm text-terracotta"
        >
          Your previous page link was outdated or invalid. Displaying the first
          page of results.
        </div>
      )}

      {/* Filter and search bar */}
      <div className="mb-10">
        <CatalogFilters categories={categories} params={params} />
      </div>

      {/* Product list or empty state */}
      {products.length === 0 ? (
        <CatalogEmpty params={params} />
      ) : (
        <>
          <div className="mb-4 text-xs font-semibold tracking-wider text-ink/50 uppercase">
            Showing {products.length}{" "}
            {products.length === 1 ? "piece" : "pieces"}
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <CatalogPagination
            currentParams={params}
            nextCursor={nextCursor}
          />
        </>
      )}
    </>
  );
}

function CatalogContentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-10 h-24 w-full rounded-2xl bg-canvas-deep/40" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-canvas"
          >
            <div className="aspect-[4/3] w-full bg-canvas-deep/70" />
            <div className="p-5">
              <div className="h-3 w-20 rounded bg-ink/10" />
              <div className="mt-2 h-6 w-3/4 rounded bg-ink/15" />
              <div className="mt-6 border-t border-ink/8 pt-4">
                <div className="h-5 w-24 rounded bg-ink/15" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CatalogPage({ searchParams }: CatalogPageProps) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      {/* Header section (static) */}
      <div className="mb-10 max-w-3xl">
        <p className="eyebrow mb-3 text-terracotta">Public Catalog</p>
        <h1 className="font-serif text-4xl tracking-tight text-ink sm:text-5xl">
          Curated Furniture Pieces
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink/70 sm:text-lg">
          Browse real-scale furniture from verified manufacturers. Every piece
          is built with verified dimensions and customizable finishes ready for
          your virtual space.
        </p>
      </div>

      <Suspense fallback={<CatalogContentSkeleton />}>
        <CatalogContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
