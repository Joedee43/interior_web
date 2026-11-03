import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { fetchCatalogCategories } from "@/lib/catalog/api";

const customerBenefits = [
  {
    number: "01",
    title: "True-to-scale dimensions",
    body: "Every piece in the catalog specifies millimetre-accurate width, depth, and height so you know with certainty whether it fits your room.",
  },
  {
    number: "02",
    title: "Configurable materials & finishes",
    body: "Explore authentic wood grains, durable textiles, and custom swatches tied directly to the maker's actual workshop options.",
  },
  {
    number: "03",
    title: "Direct maker quotations",
    body: "Select pieces from verified manufacturers, place them together in a virtual layout, and request consolidated proposals without middlemen.",
  },
];

async function CategoriesList() {
  const categories = await fetchCatalogCategories();

  if (categories.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-dashed border-ink/15 p-8 text-center text-sm text-ink/60">
        Browse all collections in the{" "}
        <Link href="/catalog" className="underline hover:text-terracotta">
          furniture catalog
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/catalog?category=${encodeURIComponent(category.slug)}`}
          className="group flex flex-col justify-between rounded-2xl border border-ink/10 bg-canvas-deep/40 p-6 transition-all duration-300 hover:border-ink/30 hover:bg-canvas hover:shadow-lg"
        >
          <div>
            <span className="eyebrow text-ink/40">Category</span>
            <h3 className="mt-2 font-serif text-xl text-ink group-hover:text-terracotta transition-colors">
              {category.name}
            </h3>
          </div>
          <div className="mt-8 flex items-center justify-between text-xs font-semibold text-ink/60 group-hover:text-ink">
            <span>Browse pieces</span>
            <span
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-36 rounded-2xl bg-canvas-deep/40" />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden border-b border-ink/10">
        <div className="hero-grid absolute inset-0 -z-10 opacity-55" />
        <div className="mx-auto grid min-h-[calc(100svh-4.5rem)] max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 lg:grid-cols-[1.12fr_0.88fr] lg:py-28">
          <div className="max-w-3xl">
            <p className="eyebrow mb-7 text-terracotta">
              Furniture commerce, made spatial
            </p>
            <h1 className="max-w-4xl font-serif text-[clamp(3.5rem,9vw,7.8rem)] leading-[0.86] tracking-[-0.065em] text-balance">
              Make room for certainty.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-ink/66 sm:text-xl">
              Configure furniture, verify dimensions at real architectural scale,
              and receive direct quotes from independent makers—all before the
              first box reaches your door.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="primary">
                <Link href="/catalog">
                  Browse furniture
                  <span aria-hidden="true" className="ml-1">
                    →
                  </span>
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href="#categories">Explore categories</a>
              </Button>
            </div>
          </div>

          <div
            id="experience"
            className="relative mx-auto aspect-[4/5] w-full max-w-lg overflow-hidden rounded-[2rem] bg-moss text-canvas shadow-[0_35px_90px_rgba(35,43,33,0.2)]"
          >
            <div className="absolute inset-5 rounded-[1.35rem] border border-canvas/25" />
            <div className="absolute left-[13%] top-[12%] h-[38%] w-[74%] rounded-t-full border border-canvas/25" />
            <div className="absolute bottom-[19%] left-[13%] h-[30%] w-[74%] rounded-[1.5rem] bg-canvas/10 backdrop-blur-sm" />
            <div className="absolute bottom-[22%] left-[18%] right-[18%] grid grid-cols-3 gap-3">
              <span className="aspect-square rounded-[1rem] bg-sand/85" />
              <span className="aspect-square rounded-[1rem] bg-terracotta/85" />
              <span className="aspect-square rounded-[1rem] bg-ink/70" />
            </div>
            <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between border-t border-canvas/25 pt-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-canvas/55">
                  Spatial Room Study
                </p>
                <p className="mt-1 font-serif text-2xl">8 × 6 metres</p>
              </div>
              <Link
                href="/catalog"
                className="grid size-11 place-items-center rounded-full border border-canvas/30 text-lg hover:bg-canvas/10 transition-colors"
                aria-label="Browse catalog"
              >
                ↗
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-24 sm:py-32 border-b border-ink/10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-ink/15 pb-10">
            <div>
              <p className="eyebrow text-terracotta">Curated Categories</p>
              <h2 className="mt-2 font-serif text-3xl sm:text-5xl tracking-[-0.035em]">
                Explore by Room & Function
              </h2>
            </div>
            <Button asChild variant="quiet" size="md">
              <Link href="/catalog">
                View all collections
                <span aria-hidden="true" className="ml-1">
                  →
                </span>
              </Link>
            </Button>
          </div>

          <Suspense fallback={<CategoriesSkeleton />}>
            <CategoriesList />
          </Suspense>
        </div>
      </section>

      {/* Customer Benefits Section */}
      <section id="benefits" className="bg-canvas-deep py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-8 border-b border-ink/15 pb-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow text-terracotta">Why Interior</p>
              <h2 className="mt-2 font-serif text-4xl leading-tight tracking-[-0.045em] sm:text-6xl">
                Spatial certainty before ordering.
              </h2>
            </div>
            <p className="text-base text-ink/70 self-end max-w-md">
              Eliminate the uncertainty of ordering commercial and residential
              furniture online with exact dimensions, custom material swatches,
              and direct manufacturer communication.
            </p>
          </div>

          <div className="grid divide-y divide-ink/15 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {customerBenefits.map((item) => (
              <article
                key={item.number}
                className="py-10 lg:px-8 lg:first:pl-0 lg:last:pr-0"
              >
                <p className="text-xs font-semibold tracking-[0.16em] text-terracotta">
                  {item.number}
                </p>
                <h3 className="mt-7 font-serif text-3xl tracking-[-0.035em]">
                  {item.title}
                </h3>
                <p className="mt-4 max-w-sm leading-7 text-ink/62">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="bg-ink py-20 text-canvas">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-5 sm:px-8 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl">
              Ready to furnish your space?
            </h2>
            <p className="mt-2 text-canvas/60">
              Browse our catalog of verified makers and find the right fit today.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            variant="primary"
            className="bg-canvas text-ink hover:bg-terracotta hover:text-canvas"
          >
            <Link href="/catalog">Explore Catalog</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
