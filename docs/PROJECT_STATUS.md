# Project status — interior_web

**Updated:** 2026-11-03 · **Branch:** `phase-2` · **Backend contract:** `/v1`,
OpenAPI 1.0.0

## Current phase

Phase 2 is complete on `phase-2` and awaiting merge approval. It delivers:

- Customer-facing `/catalog` route with server-side query normalization (`q`, `category`, `cursor`) and newest-first ordering.
- Concurrent server data fetching using `serverApiFetch` forwarding trusted client IPs.
- Generated OpenAPI response types with strict runtime normalization that rejects malformed catalog data.
- Display-only product cards with primary image, missing/broken-image fallback, maker name, category badge, explicit currency-code formatting, and `W × D × H` dimensions in millimetres.
- GET-based filter form supporting search, category selection, and reset, automatically discarding cursors on filter modification.
- Opaque keyset cursor pagination with Next-page navigation and browser history support.
- Refreshed customer-facing homepage (`/`) prioritizing furniture browsing, customer benefits, and API-driven category links.
- Loading skeletons, filtered/unfiltered empty states, cursor-specific recovery, and API error UI with the real backend request ID.
- Deterministic local mock API and Playwright E2E test suite covering desktop and mobile navigation.

Verification completed on 2026-11-03:

- Backend OpenAPI types match contract (`npm run api:check`).
- Strict lint (`npm run lint`) passes with 0 warnings.
- TypeScript (`npm run typecheck`) passes with 0 errors.
- Vitest unit and component tests (56 tests across 13 test files) all pass.
- Production build (`npm run build`) compiles and optimizes all routes successfully.
- Playwright E2E tests (16 tests across desktop Chromium and mobile Pixel 7) all pass from a standalone development-server setup.
- Production dependency audit (`npm audit --omit=dev`) found 0 vulnerabilities.
- Manual verification against live seeded Go API confirmed category listing, product listing, and media serving.

## Accepted delivery phases

1. Foundation and API boundary (Complete).
2. Public catalog (Complete on `phase-2`).
3. Product detail and variant resolution.
4. Authentication and protected layouts.
5. Three.js product preview and KHR material variants.
6. Design creation/list/read-only room rendering.
7. Interactive editor and auto-save.
8. Estimates and quote submission.
9. Customer quote management.
10. Accessibility, performance and production hardening.

Each phase is separately approved, implemented and merged. Seller/admin UI,
collision detection, snapping, undo/redo, payments and orders remain deferred.
