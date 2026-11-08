import Link from "next/link";

import { Button } from "@/components/ui/button";

interface CatalogFailureProps {
  requestId?: string;
  retryUrl: string;
}

export function CatalogFailure({
  requestId,
  retryUrl,
}: CatalogFailureProps) {
  return (
    <section className="rounded-3xl border border-terracotta/20 bg-canvas-deep/30 p-8 text-center sm:p-12">
      <p className="eyebrow text-terracotta">Catalog service</p>
      <h2 className="mt-3 font-serif text-3xl tracking-tight text-ink">
        Unable to load furniture pieces
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink/70">
        The catalog service did not complete this request. Try again, or reset
        the catalog if the problem continues.
      </p>
      {requestId && (
        <p className="mx-auto mt-5 w-fit rounded-lg border border-ink/10 bg-canvas px-4 py-2 font-mono text-xs text-ink-muted">
          Request ID: <span className="select-all text-ink">{requestId}</span>
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="md">
          <a href={retryUrl}>Try again</a>
        </Button>
        <Button asChild variant="secondary" size="md">
          <Link href="/catalog">Reset catalog</Link>
        </Button>
      </div>
    </section>
  );
}
