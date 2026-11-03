import Link from "next/link";

import { Button } from "@/components/ui/button";
import { isFiltered } from "@/lib/catalog/query";
import type { CatalogQueryParams } from "@/lib/catalog/types";

interface CatalogEmptyProps {
  params: CatalogQueryParams;
}

export function CatalogEmpty({ params }: CatalogEmptyProps) {
  const filtered = isFiltered(params);

  if (filtered) {
    return (
      <div
        className="my-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink/20 bg-canvas-deep/30 px-6 py-16 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="grid size-12 place-items-center rounded-full bg-ink/5 text-ink/60">
          <svg
            className="size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </div>
        <h2 className="mt-4 font-serif text-2xl tracking-tight text-ink">
          No furniture matches your search
        </h2>
        <p className="mt-2 max-w-md text-sm text-ink/65">
          We couldn&apos;t find any pieces matching your current filters. Try
          adjusting your search keywords or choosing another category.
        </p>
        <div className="mt-6">
          <Button asChild variant="primary" size="md">
            <Link href="/catalog">Clear all filters</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="my-12 flex flex-col items-center justify-center rounded-3xl border border-ink/10 bg-canvas-deep/20 px-6 py-16 text-center"
      role="status"
    >
      <div className="grid size-12 place-items-center rounded-full bg-ink/5 text-ink/60">
        <svg
          className="size-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </svg>
      </div>
      <h2 className="mt-4 font-serif text-2xl tracking-tight text-ink">
        No furniture available yet
      </h2>
      <p className="mt-2 max-w-md text-sm text-ink/65">
        Our curated makers are preparing new collections for the catalog.
        Please check back shortly.
      </p>
      <div className="mt-6">
        <Button asChild variant="secondary" size="md">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
