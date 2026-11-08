"use client";

import Link from "next/link";

import { AccountNav } from "@/components/auth/account-nav";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-ink/10 bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta"
        >
          {/* The name comes from the text, not aria-label: an aria-label must
              contain all visible text, and the "I" monogram is visible. The
              wordmark is screen-reader-only on phones, visible from sm up. */}
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-ink text-sm font-semibold text-canvas">
            I
          </span>
          <span className="sr-only font-serif text-xl tracking-[-0.03em] sm:not-sr-only">Interior</span>
          <span className="sr-only"> home</span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 md:flex"
        >
          <Link className="nav-link font-medium" href="/catalog">
            Catalog
          </Link>
          <Link className="nav-link font-medium" href="/#categories">
            Categories
          </Link>
          <Link className="nav-link font-medium" href="/#benefits">
            How it works
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild variant="secondary" size="sm">
            <Link href="/catalog" aria-label="Browse Catalog"><span className="sm:hidden">Catalog</span><span className="hidden sm:inline">Browse Catalog</span></Link>
          </Button>
          <AccountNav />
        </div>
      </div>
    </header>
  );
}
