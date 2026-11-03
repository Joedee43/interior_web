# Project status — interior_web

**Updated:** 2026-11-03 · **Branch:** `phase-1` · **Backend contract:** `/v1`,
OpenAPI 1.0.0

## Current phase

Phase 1 is complete on `phase-1` and awaiting merge approval. It establishes:

- Next.js App Router and strict TypeScript.
- Warm editorial design tokens, responsive shell and accessible primitives.
- Radix UI as the headless component library.
- Same-origin Go rewrites and validated server-only configuration.
- Generated OpenAPI types plus browser/server fetch boundaries.
- Opt-in TanStack Query provider for later authenticated areas.
- Vitest, Testing Library, Playwright and GitHub Actions harnesses.

Verification completed on 2026-11-03:

- Backend OpenAPI types are current (`npm run api:check`).
- ESLint and TypeScript pass with no warnings or errors.
- All 10 unit tests pass.
- The production Webpack build succeeds.
- Playwright passes in desktop Chromium and a mobile Pixel 7 profile.
- Live Next.js rewrites to the Go API were checked for `/v1/*` and
  `/openapi.yaml`.

## Accepted delivery phases

1. Foundation and API boundary.
2. Public catalog.
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
