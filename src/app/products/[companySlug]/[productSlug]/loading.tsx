export default function ProductDetailLoading() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 animate-pulse">
      {/* Breadcrumbs skeleton */}
      <div className="mb-8 flex items-center gap-2">
        <div className="h-3 w-12 rounded bg-canvas-deep/50" />
        <div className="h-3 w-3 rounded bg-canvas-deep/30" />
        <div className="h-3 w-16 rounded bg-canvas-deep/50" />
        <div className="h-3 w-3 rounded bg-canvas-deep/30" />
        <div className="h-3 w-20 rounded bg-canvas-deep/50" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Left Column Gallery Skeleton */}
        <div className="lg:col-span-7">
          <div className="aspect-[4/3] w-full rounded-2xl bg-canvas-deep/50" />
          <div className="mt-4 flex gap-2.5">
            <div className="size-16 sm:size-20 rounded-xl bg-canvas-deep/40" />
            <div className="size-16 sm:size-20 rounded-xl bg-canvas-deep/40" />
            <div className="size-16 sm:size-20 rounded-xl bg-canvas-deep/40" />
          </div>
        </div>

        {/* Right Column Details Skeleton */}
        <div className="flex flex-col gap-8 lg:col-span-5">
          <div>
            <div className="h-4 w-24 rounded bg-canvas-deep/50" />
            <div className="mt-3 h-8 w-3/4 rounded bg-canvas-deep/60" />
          </div>

          <div className="h-28 rounded-2xl bg-canvas-deep/40" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-canvas-deep/40" />
            <div className="h-4 w-5/6 rounded bg-canvas-deep/40" />
          </div>

          <div className="h-36 rounded-2xl bg-canvas-deep/30" />
        </div>
      </div>
    </main>
  );
}
