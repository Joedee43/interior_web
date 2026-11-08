"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CatalogError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Catalog route error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 text-center">
      <div className="mx-auto max-w-xl rounded-3xl border border-terracotta/20 bg-canvas-deep/30 p-8 sm:p-12">
        <span className="eyebrow text-terracotta">Catalog Service</span>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink">
          Unable to load furniture pieces
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink/70">
          We encountered an unexpected error while retrieving the catalog from the
          server. Please try again or clear your current search.
        </p>

        {error.digest && (
          <div className="mt-5 rounded-lg bg-canvas px-4 py-2 font-mono text-xs text-ink-muted border border-ink/10">
            Error reference:{" "}
            <span className="text-ink select-all">{error.digest}</span>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => reset()} variant="primary" size="md">
            Try again
          </Button>
          <Button asChild variant="secondary" size="md">
            <Link href="/catalog">Reset catalog</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
