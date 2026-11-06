# Project status — interior_web

**Updated:** 2026-11-06 · **Branch:** `phase-7` · **Backend contract:** `/v1`,
OpenAPI 1.0.0

## Current phase

Phase 7 is complete on `phase-7` and awaiting merge approval. It delivers:

- A protected `/designs/[designID]/edit` route, with the existing design page retained as the read-only customer view.
- Revision-aware design and item APIs using exact `ETag`/`If-Match` values, strict response normalization, ownership-aware 404s and backend request IDs.
- A design-scoped Zustand store with optimistic drafts, one serialized aggregate mutation queue, repeated-edit coalescing, 500 ms valid-input saves, retryable failures, auth clearing on 401 and post-save estimate reconciliation.
- Explicit `Saved`, `Saving`, `Unsaved`, `Conflict` and failure states. Stale revisions pause the queue and let the customer review the latest room or reapply the local operation against its revision.
- Desktop Three.js furniture selection and floor-raycast dragging with orbit disabled during movement. Mobile stays GLB-free and edits through an SVG top-down plan; WebGL loss falls back to that same plan.
- Rotated-footprint clamping, positive counter-clockwise rotation, exact millimetre controls and accessible DOM furniture selection in addition to pointer controls. Furniture overlap remains allowed; there is no snapping or collision system.
- Room renaming, metre-based resizing, wall colour, floor finish and door/window authoring with room, ceiling, count and same-wall rectangular-overlap checks.
- A Radix UI catalog drawer with editor-scoped search, category filtering, opaque pagination, strict product details, available-variant placement and exact KHR SKU switching.
- Furniture add, position, rotation, variant and remove operations plus confirmed design deletion.
- A stateful revision-enforcing mock API and desktop/mobile coverage for persistence, GLB deferral, strict editor protection, two-tab stale conflicts and deletion.

Verification completed on 2026-11-06:

- `git diff --check` passes.
- Backend OpenAPI types match contract (`npm run api:check`).
- Strict lint (`npm run lint`) passes with 0 warnings.
- TypeScript (`npm run typecheck`) passes with 0 errors.
- Vitest unit and component tests (183 tests across 44 test files) all pass.
- Production build (`npm run build`) compiles successfully; protected design routes render at request time while design detail retains partial prerendering with request-time data.
- Playwright E2E tests pass from a standalone development-server startup: 73 pass and 5 intentional platform-specific cases skip across desktop Chromium and mobile Pixel 7.
- Production dependency audit (`npm audit --omit=dev`) found 0 vulnerabilities.
- Real Go API verification migrated and reseeded development data, moved the grey chair to `(1700, 0, 1900)` mm at 45°, reloaded the exact persisted values, restored `(1600, 0, 1800)` mm at 30°, added and removed the blue SKU, and observed monotonic ETags through `design-6`. The demo room was left restored with one grey chair.

## Accepted delivery phases

1. Foundation and API boundary (Complete).
2. Public catalog (Complete on `main`).
3. Product detail and variant resolution (Complete on `main`).
4. Authentication and protected layouts (Complete on `main`).
5. Three.js product preview and KHR material variants (Complete on `main`).
6. Design creation/list/read-only room rendering (Complete on `main`).
7. Interactive editor and auto-save (Complete on `phase-7`).
8. Estimates and quote submission.
9. Customer quote management.
10. Accessibility, performance and production hardening.

Each phase is separately approved, implemented and merged. Seller/admin UI,
collision detection, snapping, undo/redo, payments and orders remain deferred.
