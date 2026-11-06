# Project status — interior_web

**Updated:** 2026-11-06 · **Branch:** `phase-6` · **Backend contract:** `/v1`,
OpenAPI 1.0.0

## Current phase

Phase 6 is complete on `phase-6` and awaiting merge approval. It delivers:

- Strict room-template, design-summary and design-detail normalization, including UUIDs, dates, dimensions, finishes, openings, positions, rotations, prices, estimates, exact nullable variant SKUs and byte-for-byte cursor preservation.
- Authenticated TanStack Query list/detail APIs under `designs` keys, server-provided initial data, real backend request IDs, strict ownership-aware 404 handling and automatic auth-cache clearing on 401.
- Protected `/designs`, `/designs/new` and `/designs/[designID]` routes with preserved login return paths, newest-edited-first infinite pagination, signed-in navigation and account-page entry.
- Published-template and custom-room creation with exact decimal metre-to-millimetre conversion, three-decimal precision, backend-aligned dimension limits, uppercase wall colours, basic floor finishes and duplicate-submission protection.
- A read-only Three.js room using the north-west floor origin, X east, Z south and Y up. Saved positive rotations map directly to `rotation.y`, geometry is never resized, walls are segmented around doors/windows, and the camera fits the room with orbit, pan, zoom and reset controls.
- Desktop automatic room loading and a mobile-first top-down plan that defers all room GLBs until the customer requests 3D.
- Skeleton-safe cached model clones, exact case-sensitive KHR SKU application, original materials for non-configurable products, development dimension checks and item-level dimensioned placeholders for absent or broken models.
- Accessible furniture, availability and position summaries plus current-price estimates grouped by seller and currency. Empty rooms remain valid and quote controls remain deferred.
- A stateful mock API with templates, opaque pagination, creation, exact design SKU data, estimates, ownership 404s and request-ID error fixtures.

Verification completed on 2026-11-06:

- `git diff --check` passes.
- Backend OpenAPI types match contract (`npm run api:check`).
- Strict lint (`npm run lint`) passes with 0 warnings.
- TypeScript (`npm run typecheck`) passes with 0 errors.
- Vitest unit and component tests (171 tests across 41 test files) all pass.
- Production build (`npm run build`) compiles successfully; protected design routes render at request time while design detail retains partial prerendering with request-time data.
- Playwright E2E tests pass from a standalone development-server startup: 68 pass and 4 intentional platform-specific cases skip across desktop Chromium and mobile Pixel 7.
- Production dependency audit (`npm audit --omit=dev`) found 0 vulnerabilities.
- Manual browser verification against an isolated real Go API confirmed “My living room” loads its exact `DEMO-CHAIR-GREY` model at `(1600, 0, 1800)` mm with 30° rotation and no dimension warning.

## Accepted delivery phases

1. Foundation and API boundary (Complete).
2. Public catalog (Complete on `main`).
3. Product detail and variant resolution (Complete on `main`).
4. Authentication and protected layouts (Complete on `main`).
5. Three.js product preview and KHR material variants (Complete on `main`).
6. Design creation/list/read-only room rendering (Complete on `phase-6`).
7. Interactive editor and auto-save.
8. Estimates and quote submission.
9. Customer quote management.
10. Accessibility, performance and production hardening.

Each phase is separately approved, implemented and merged. Seller/admin UI,
collision detection, snapping, undo/redo, payments and orders remain deferred.
