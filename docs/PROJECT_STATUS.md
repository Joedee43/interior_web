# Project status — interior_web

**Updated:** 2026-11-04 · **Branch:** `phase-3` · **Backend contract:** `/v1`,
OpenAPI 1.0.0

## Current phase

Phase 3 is complete on `phase-3` and awaiting merge approval. It delivers:

- Customer-facing `/products/[companySlug]/[productSlug]` route with shareable `?variant=SKU` query parameter.
- Server-side data fetching via `getProductDetail` using generated OpenAPI contract types, request-scoped React 19 `cache()` deduplication, and strict runtime normalization.
- Rejection of invalid payloads: malformed required product, media, option, value, variant, and configuration fields; unsafe or non-positive numeric values; invalid currencies, media metadata, swatches, and material keys; duplicate IDs/SKUs/combinations; incomplete combinations; mismatched option maps; variant currency mismatches; and primary images absent from the gallery. Only a backend 404 produces a missing-product result.
- Accessible catalog integration: catalog product cards link seamlessly to `/products/:companySlug/:productSlug`.
- Responsive product detail layout with accessible breadcrumbs, maker name, product title, description, dimensions, formatted weight (when present), and specifications.
- Interactive product gallery with primary image, broken-image fallback, keyboard-accessible thumbnail switching, and full-screen modal lightbox enlargement powered by `@radix-ui/react-dialog`.
- Deterministic variant resolution:
  - Case-sensitive SKU matching.
  - Fallback to first available variant by position, or first variant if all are unavailable.
  - Valid unavailable SKUs remain selected and clearly display "Currently unavailable".
  - Unknown SKUs cleanly fall back to default and are replaced with the canonical selected SKU via `router.replace(..., { scroll: false })`.
  - Option values with no available matching variant are disabled, except values belonging to the currently selected unavailable SKU.
  - Selecting an option value chooses the available variant that preserves the most current selections, with variant position as deterministic tie-breaker.
- Clean presentation for non-configurable products: renders base price, dimensions, weight, and no configurator.
- SEO & structured data: dynamic metadata with one application of the Interior brand, description, canonical URL without variant query, Open Graph image, and sanitized schema.org `Product` JSON-LD. Structured data uses absolute image URLs and each currency's actual fraction digits, includes only available variants in `AggregateOffer`, and emits an out-of-stock `Offer` when every variant is unavailable.
- Zero placeholder or disabled action buttons: strictly no disabled cart, quote, design, or authentication actions.
- Error resilience: backend 404 triggers Next.js `notFound()`. API failures render recovery UI inside the Server Component boundary with the real backend request ID; unexpected application failures use the client error boundary and label a Next.js digest only as an internal error reference.
- Valid page semantics: the root layout owns the only `<main>` landmark on product pages.
- Browser tests start their own Next.js development server, so `npm run test:e2e` does not depend on a pre-existing production build.

Verification completed on 2026-11-04:

- `git diff --check` passes.
- Backend OpenAPI types match contract (`npm run api:check`).
- Strict lint (`npm run lint`) passes with 0 warnings.
- TypeScript (`npm run typecheck`) passes with 0 errors.
- Vitest unit and component tests (97 tests across 19 test files) all pass.
- Production build (`npm run build`) compiles and partial-prerenders all routes successfully.
- Playwright E2E tests (32 tests across desktop Chromium and mobile Pixel 7) all pass from a standalone development-server startup.
- Production dependency audit (`npm audit --omit=dev`) found 0 vulnerabilities.
- Manual checks against the running Go API rendered the seeded configurable `addis-lounge-chair` and non-configurable `oslo-3-seat-sofa` with HTTP 200 responses and their expected product names and prices.

## Accepted delivery phases

1. Foundation and API boundary (Complete).
2. Public catalog (Complete on `main`).
3. Product detail and variant resolution (Complete on `phase-3`).
4. Authentication and protected layouts.
5. Three.js product preview and KHR material variants.
6. Design creation/list/read-only room rendering.
7. Interactive editor and auto-save.
8. Estimates and quote submission.
9. Customer quote management.
10. Accessibility, performance and production hardening.

Each phase is separately approved, implemented and merged. Seller/admin UI,
collision detection, snapping, undo/redo, payments and orders remain deferred.
