# Project status — interior_web

**Updated:** 2026-11-04 · **Branch:** `phase-5` · **Backend contract:** `/v1`,
OpenAPI 1.0.0

## Current phase

Phase 5 is complete on `phase-5` and awaiting merge approval. It delivers:

- An accessible Photos/3D media viewer that preserves the Phase 3 gallery and lightbox. Desktop activates 3D after hydration; mobile does not request the GLB until the customer selects 3D.
- Exact pins for `three@0.187.0`, `@react-three/fiber@9.8.2` and `@react-three/drei@10.7.9`.
- Demand-driven rendering with DPR capped at 2, neutral lighting and floor, bounded manual orbit/zoom, pan disabled, usage instructions and reset view.
- Manual `KHR_materials_variants` processing using loader extension metadata and parser material dependencies. Backend SKUs and material keys are checked against the media contract, KHR names are exact and case-sensitive, and non-configurable models retain their original materials.
- URL-driven preview synchronization through the same variant resolver as the configurator, including valid unavailable deep links. Changing grey/blue finishes reuses the cached GLB.
- Skeleton-safe scene clones, preview-owned material clones, last-selection-wins asynchronous updates, original-material restoration and owned-resource cleanup without disposing shared loader geometry or textures.
- Pivot normalization that centres X/Z and grounds Y without resizing. Development checks compare X→width, Z→depth and Y→height in metres and warn once only above a 5% mismatch.
- Isolated recovery for missing WebGL2, GLB loading/parsing errors, invalid preview contracts and WebGL context loss. Product imagery, options, pricing and information remain available, and failed loader entries can be cleared and retried.
- A valid binary mock GLB with exact mock SKUs/materials, a deliberately broken model fixture, and isolated Playwright build output so browser tests can start alongside another local Next development process.
- Room rendering, placement, collision detection, editor state and Zustand remain deferred to later phases.

Verification completed on 2026-11-04:

- `git diff --check` passes.
- Backend OpenAPI types match contract (`npm run api:check`).
- Strict lint (`npm run lint`) passes with 0 warnings.
- TypeScript (`npm run typecheck`) passes with 0 errors.
- Vitest unit and component tests (152 tests across 35 test files) all pass.
- Production build (`npm run build`) compiles successfully; `/login`, `/register` and `/account` are request-time routes while public routes retain their existing static/partial-prerender behavior.
- Playwright E2E tests pass from a standalone development-server startup: 56 pass and 2 intentional platform-specific cases skip across desktop Chromium and mobile Pixel 7.
- Production dependency audit (`npm audit --omit=dev`) found 0 vulnerabilities.
- Manual verification against the running Go API confirmed the seeded `addis-lounge-chair` renders `DEMO-CHAIR-GREY` and `DEMO-CHAIR-BLUE`, orbit/zoom/reset controls remain active, and the exact 0.8 × 0.8 × 0.9 metre GLB produces no dimension warning. The seeded `oslo-3-seat-sofa` remains image-only with no 3D tab.

## Accepted delivery phases

1. Foundation and API boundary (Complete).
2. Public catalog (Complete on `main`).
3. Product detail and variant resolution (Complete on `main`).
4. Authentication and protected layouts (Complete on `main`).
5. Three.js product preview and KHR material variants (Complete on `phase-5`).
6. Design creation/list/read-only room rendering.
7. Interactive editor and auto-save.
8. Estimates and quote submission.
9. Customer quote management.
10. Accessibility, performance and production hardening.

Each phase is separately approved, implemented and merged. Seller/admin UI,
collision detection, snapping, undo/redo, payments and orders remain deferred.
