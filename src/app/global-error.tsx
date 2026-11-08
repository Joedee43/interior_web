"use client";

import Link from "next/link";
import "./globals.css";

// Replaces the root layout when the layout itself fails, so it renders its own
// <html>/<body> and imports the global styles (Next does not apply them here).
// retry() re-fetches and re-renders, unlike reset(), which only re-renders.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-full bg-canvas text-ink antialiased">
        <title>Something went wrong · Interior</title>
        <main className="mx-auto flex min-h-svh max-w-2xl flex-col items-start justify-center px-5 py-20 sm:px-8">
          <p className="eyebrow text-terracotta">Something shifted</p>
          <h1 className="mt-5 font-serif text-5xl tracking-[-0.045em]">We couldn’t open Interior.</h1>
          <p className="mt-5 max-w-lg leading-7 text-ink-muted">
            The page failed before it could load. Your rooms and quote requests are safe. Try again, or come back in a moment.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {/* Plain elements keep this page independent of shared components,
                which may be what failed. */}
            <button type="button" onClick={() => retry()} className="h-11 rounded-full bg-ink px-5 text-sm font-medium text-canvas hover:bg-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta">
              Try again
            </button>
            <Link href="/" className="inline-flex h-11 items-center rounded-full border border-ink/15 px-5 text-sm font-medium hover:border-ink/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
              Go to the home page
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
