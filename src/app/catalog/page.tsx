import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogEmpty } from "@/components/catalog/catalog-empty";
import { CatalogFailure } from "@/components/catalog/catalog-failure";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogPagination } from "@/components/catalog/catalog-pagination";
import { ProductCard } from "@/components/catalog/product-card";
import { ApiError } from "@/lib/api/error";
import { fetchCatalogCategories, fetchCatalogProducts } from "@/lib/catalog/api";
import { buildCatalogUrl, parseCatalogParams } from "@/lib/catalog/query";
import type {
  CatalogCategory,
  CatalogPage as CatalogPageData,
} from "@/lib/catalog/types";

interface CatalogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: CatalogPageProps): Promise<Metadata> {
  const resolved = await searchParams;
  const params = parseCatalogParams(resolved);

  let title = "Furniture Catalog";
  if (params.q) {
    title = `“${params.q}” — Furniture Catalog`;
  } else if (params.category) {
    const categoryName = params.category
      .split("-")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ");
    title = `${categoryName} — Furniture Catalog`;
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

  let categories: CatalogCategory[];
  let catalogPage: CatalogPageData;
  try {
    [categories, catalogPage] = await Promise.all([
      fetchCatalogCategories(),
      fetchCatalogProducts(params),
    ]);
  } catch (error) {
    if (error instanceof ApiError) {
      return (
        <CatalogFailure
          requestId={error.requestId}
          retryUrl={buildCatalogUrl(params)}
        />
      );
    }
    throw error;
  }

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
          Browse furniture from independent makers using clear catalog
          dimensions and finish options prepared for future room planning.
        </p>
      </div>

      <Suspense fallback={<CatalogContentSkeleton />}>
        <CatalogContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
