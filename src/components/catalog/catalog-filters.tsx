import Link from "next/link";

import { Button } from "@/components/ui/button";
import { hasActiveFilters } from "@/lib/catalog/query";
import {
  type CatalogCategory,
  type CatalogQueryParams,
} from "@/lib/catalog/types";

interface CatalogFiltersProps {
  categories: CatalogCategory[];
  params: CatalogQueryParams;
}

export function CatalogFilters({ categories, params }: CatalogFiltersProps) {
  const activeFilters = hasActiveFilters(params);

  return (
    <form
      method="GET"
      action="/catalog"
      className="rounded-2xl border border-ink/10 bg-canvas-deep/40 p-4 sm:p-6"
      role="search"
      aria-label="Filter catalog products"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
        {/* Search query input */}
        <div className="lg:col-span-6">
          <label
            htmlFor="catalog-search"
            className="block text-xs font-semibold tracking-wider text-ink/70 uppercase"
          >
            Search
          </label>
          <div className="relative mt-1.5">
            <input
              id="catalog-search"
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search by furniture name..."
              className="h-11 w-full rounded-xl border border-ink/15 bg-canvas px-4 text-sm text-ink placeholder:text-ink/40 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>
        </div>

        {/* Category selector */}
        <div className="lg:col-span-4">
          <label
            htmlFor="catalog-category"
            className="block text-xs font-semibold tracking-wider text-ink/70 uppercase"
          >
            Category
          </label>
          <div className="mt-1.5">
            <select
              id="catalog-category"
              name="category"
              defaultValue={params.category ?? ""}
              className="h-11 w-full rounded-xl border border-ink/15 bg-canvas px-3 text-sm text-ink focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions: Apply & Clear */}
        <div className="flex items-center gap-2 lg:col-span-2">
          <Button type="submit" variant="primary" size="md" className="flex-1">
            Apply
          </Button>

          {activeFilters && (
            <Button asChild variant="quiet" size="md">
              <Link href="/catalog">Clear</Link>
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
