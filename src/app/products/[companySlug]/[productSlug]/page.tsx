import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductConfigurator } from "@/components/product/product-configurator";
import { ProductFailure } from "@/components/product/product-failure";
import { ProductMediaViewer } from "@/components/product/product-media-viewer";
import { ApiError } from "@/lib/api/error";
import { getProductDetail } from "@/lib/catalog/detail-api";
import { buildProductJsonLd, sanitizeJsonLd } from "@/lib/catalog/json-ld";
import { serverEnv } from "@/lib/env/server";

interface PageProps {
  params: Promise<{
    companySlug: string;
    productSlug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { companySlug, productSlug } = await params;
  let product;
  try {
    product = await getProductDetail(companySlug, productSlug);
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        title: "Product",
        robots: { index: false, follow: false },
      };
    }
    throw error;
  }

  if (!product) {
    notFound();
  }

  const canonicalUrl = `${serverEnv.NEXT_PUBLIC_APP_URL}/products/${product.company.slug}/${product.slug}`;
  const description =
    product.description ||
    `${product.name} by ${product.company.name} in ${product.category.name}.`;

  return {
    title: `${product.name} — ${product.company.name}`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.name} — ${product.company.name}`,
      description,
      url: canonicalUrl,
      images: product.primaryImageUrl ? [{ url: product.primaryImageUrl }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { companySlug, productSlug } = await params;
  const retryUrl = `/products/${encodeURIComponent(companySlug)}/${encodeURIComponent(productSlug)}`;
  let product;
  try {
    product = await getProductDetail(companySlug, productSlug);
  } catch (error) {
    if (error instanceof ApiError) {
      return (
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <ProductFailure requestId={error.requestId} retryUrl={retryUrl} />
        </div>
      );
    }
    throw error;
  }

  if (!product) {
    notFound();
  }

  const canonicalUrl = `${serverEnv.NEXT_PUBLIC_APP_URL}/products/${product.company.slug}/${product.slug}`;
  const jsonLd = buildProductJsonLd(product, canonicalUrl);
  const sanitizedJsonLd = sanitizeJsonLd(jsonLd);

  return (
    <>
      {/* Product JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizedJsonLd }}
      />

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Accessible Breadcrumbs */}
        <nav
          aria-label="Breadcrumbs"
          className="mb-8 flex flex-wrap items-center gap-2 text-xs text-ink-muted"
        >
          <Link
            href="/"
            className="hover:text-ink transition-colors underline-offset-4 hover:underline"
          >
            Home
          </Link>
          <span aria-hidden="true" className="text-ink/30">
            /
          </span>
          <Link
            href="/catalog"
            className="hover:text-ink transition-colors underline-offset-4 hover:underline"
          >
            Catalog
          </Link>
          <span aria-hidden="true" className="text-ink/30">
            /
          </span>
          <Link
            href={`/catalog?category=${encodeURIComponent(product.category.slug)}`}
            className="hover:text-ink transition-colors underline-offset-4 hover:underline"
          >
            {product.category.name}
          </Link>
          <span aria-hidden="true" className="text-ink/30">
            /
          </span>
          <span aria-current="page" className="font-medium text-ink truncate">
            {product.name}
          </span>
        </nav>

        {/* Product Details Two-Column Grid */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Gallery & Images */}
          <div className="lg:col-span-7">
            <Suspense
              fallback={
                <div className="aspect-[4/3] animate-pulse rounded-2xl bg-canvas-deep/30" />
              }
            >
              <ProductMediaViewer product={product} />
            </Suspense>
          </div>

          {/* Right Column: Information, Configurator & Specs */}
          <div className="flex flex-col gap-8 lg:col-span-5">
            <div>
              <p className="eyebrow text-terracotta">
                {product.company.name}
              </p>
              <h1 className="mt-2 font-serif text-3xl sm:text-4xl tracking-tight text-ink">
                {product.name}
              </h1>
            </div>

            {/* Configurator or Base Price */}
            {product.hasOptions ? (
              <Suspense
                fallback={
                  <div className="h-32 animate-pulse rounded-2xl bg-canvas-deep/30" />
                }
              >
                <ProductConfigurator product={product} />
              </Suspense>
            ) : (
              <div className="flex flex-col gap-2 border-b border-ink/10 pb-5">
                <div className="flex items-baseline justify-between gap-4">
                  <span
                    className="font-serif text-3xl font-semibold tracking-tight text-ink"
                    data-testid="base-price"
                  >
                    {product.formattedBasePrice}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-moss/10 px-3 py-1 text-xs font-medium tracking-wide text-moss">
                    <span className="size-1.5 rounded-full bg-moss" aria-hidden="true" />
                    In stock
                  </span>
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="prose prose-sm text-ink/75 leading-relaxed">
                <p>{product.description}</p>
              </div>
            )}

            {/* Product Specifications */}
            <div className="rounded-2xl border border-ink/10 bg-canvas-deep/20 p-5">
              <h2 className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                Specifications
              </h2>
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                <div>
                  <dt className="text-ink-muted">Dimensions</dt>
                  <dd className="mt-1 font-mono font-medium text-ink">
                    {product.formattedDimensions}
                  </dd>
                </div>

                {product.formattedWeight && (
                  <div>
                    <dt className="text-ink-muted">Weight</dt>
                    <dd className="mt-1 font-mono font-medium text-ink">
                      {product.formattedWeight}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-ink-muted">Category</dt>
                  <dd className="mt-1 font-medium text-ink">
                    {product.category.name}
                  </dd>
                </div>

                <div>
                  <dt className="text-ink-muted">Maker</dt>
                  <dd className="mt-1 font-medium text-ink">
                    {product.company.name}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
