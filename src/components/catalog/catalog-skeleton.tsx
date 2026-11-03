export function CatalogSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8" aria-busy="true">
      {/* Header skeleton */}
      <div className="mb-10 max-w-2xl animate-pulse">
        <div className="h-4 w-28 rounded bg-ink/10" />
        <div className="mt-3 h-12 w-80 rounded-lg bg-ink/15" />
        <div className="mt-4 h-5 w-full max-w-md rounded bg-ink/10" />
      </div>

      {/* Filter skeleton */}
      <div className="mb-10 h-24 w-full animate-pulse rounded-2xl bg-canvas-deep/40" />

      {/* Product grid skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-canvas animate-pulse"
          >
            <div className="aspect-[4/3] w-full bg-canvas-deep/70" />
            <div className="p-5">
              <div className="h-3 w-20 rounded bg-ink/10" />
              <div className="mt-2 h-6 w-3/4 rounded bg-ink/15" />
              <div className="mt-2 h-4 w-full rounded bg-ink/8" />
              <div className="mt-6 border-t border-ink/8 pt-4">
                <div className="flex justify-between">
                  <div className="h-4 w-12 rounded bg-ink/10" />
                  <div className="h-5 w-24 rounded bg-ink/15" />
                </div>
                <div className="mt-2 flex justify-between">
                  <div className="h-3 w-16 rounded bg-ink/10" />
                  <div className="h-3 w-28 rounded bg-ink/10" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
