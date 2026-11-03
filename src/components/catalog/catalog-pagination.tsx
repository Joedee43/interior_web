import Link from "next/link";

import { Button } from "@/components/ui/button";
import { buildNextPageUrl } from "@/lib/catalog/query";
import type { CatalogQueryParams } from "@/lib/catalog/types";

interface CatalogPaginationProps {
  currentParams: CatalogQueryParams;
  nextCursor: string | null;
}

export function CatalogPagination({
  currentParams,
  nextCursor,
}: CatalogPaginationProps) {
  if (!nextCursor) {
    return null;
  }

  const nextPageUrl = buildNextPageUrl(currentParams, nextCursor);

  return (
    <nav
      className="mt-12 flex flex-col items-center justify-center gap-2 border-t border-ink/8 pt-8"
      aria-label="Catalog pagination"
    >
      <Button asChild variant="secondary" size="lg" className="px-8">
        <Link href={nextPageUrl} scroll={true}>
          Next page
          <span aria-hidden="true" className="ml-1">
            →
          </span>
        </Link>
      </Button>
      <p className="text-xs text-ink/50">
        Use browser back to return to prior pages.
      </p>
    </nav>
  );
}
