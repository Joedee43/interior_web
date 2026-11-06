"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/error";
import { formatDimensions } from "@/lib/catalog/format";
import { useDesigns } from "@/lib/design/query";
import type { DesignPage, RoomTemplate } from "@/lib/design/types";

export function DesignList({ initialPage, templates }: { initialPage: DesignPage; templates: RoomTemplate[] }) {
  const query = useDesigns(initialPage);
  const designs = query.data?.pages.flatMap((page) => page.designs) ?? [];
  const templateNames = new Map(templates.map((template) => [template.id, template.name]));

  if (query.isError && designs.length === 0) {
    const requestId = query.error instanceof ApiError ? query.error.requestId : undefined;
    return <div role="alert" className="rounded-2xl border border-terracotta/20 bg-terracotta/10 p-6"><p className="font-medium">Unable to load your designs.</p>{requestId && <p className="mt-2 font-mono text-xs">Request ID: {requestId}</p>}<Button className="mt-4" onClick={() => void query.refetch()}>Retry</Button></div>;
  }

  if (designs.length === 0) {
    return <div className="rounded-3xl border border-dashed border-ink/20 bg-canvas-deep/20 px-6 py-16 text-center"><h2 className="font-serif text-3xl">Start with an empty room</h2><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink/60">Choose a curated room or enter your own dimensions. Furniture placement arrives in the editor next.</p><Button asChild className="mt-7"><Link href="/designs/new">Create your first design</Link></Button></div>;
  }

  return (
    <div>
      {query.isFetching && !query.isFetchingNextPage && <p className="mb-4 text-xs text-ink/50" role="status">Refreshing designs…</p>}
      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {designs.map((design) => (
          <li key={design.id}>
            <Link href={`/designs/${design.id}`} className="block rounded-2xl border border-ink/10 bg-canvas p-6 transition hover:-translate-y-0.5 hover:border-ink/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta">
              <p className="eyebrow text-terracotta">{design.templateId ? templateNames.get(design.templateId) ?? "Room template" : "Custom room"}</p>
              <h2 className="mt-3 font-serif text-2xl">{design.name}</h2>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-xs">
                <div><dt className="text-ink/50">Dimensions</dt><dd className="mt-1 font-medium">{formatDimensions({ width_mm: design.room.widthMm, depth_mm: design.room.depthMm, height_mm: design.room.heightMm })}</dd></div>
                <div><dt className="text-ink/50">Furniture</dt><dd className="mt-1 font-medium">{design.itemCount} {design.itemCount === 1 ? "item" : "items"}</dd></div>
              </dl>
              <p className="mt-6 text-xs text-ink/45">Updated {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(design.updatedAt))}</p>
            </Link>
          </li>
        ))}
      </ul>
      {query.hasNextPage && <div className="relative z-10 mt-8 text-center"><Button variant="secondary" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>{query.isFetchingNextPage ? "Loading…" : "Load more designs"}</Button>{query.isFetchNextPageError && <p className="mt-3 text-sm text-terracotta" role="alert">The next page could not be loaded. Try again.</p>}</div>}
    </div>
  );
}
