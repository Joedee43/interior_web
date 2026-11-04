# Project status — interior_web

**Updated:** 2026-11-04 · **Branch:** `phase-4` · **Backend contract:** `/v1`,
OpenAPI 1.0.0

## Current phase

Phase 4 is complete on `phase-4` and awaiting merge approval. It delivers:

- Customer registration, login and logout through same-origin browser requests, so the Go API's HttpOnly session cookie reaches the browser unchanged.
- Strict normalization of the complete `/v1/auth/me` account contract, including user identity and company memberships. Only a 401 is treated as signed out; malformed responses and other failures remain errors.
- Request-deduplicated authenticated server fetching that forwards the incoming cookie and preserves backend request IDs.
- A stable TanStack Query provider for interactive authenticated state. Login and registration replace prior user-scoped cache, logout clears it, and any authenticated query or mutation receiving a 401 clears the cached account.
- Backend-matching React Hook Form and Zod validation: names and emails are normalized, passwords remain exact and use the backend's 12–128 Unicode-character limits, and registration confirms the password locally.
- Field-level handling for `validation_failed` and `email_taken`, generic invalid-credential copy, explicit rate-limit copy, and real request IDs for unexpected failures.
- Dynamic, no-index `/login` and `/register` routes. Safe `next` paths preserve local queries/fragments while rejecting absolute URLs, scheme-relative paths, backslashes and auth loops; `/account` is the default.
- Server-validated protection for `/account`. A missing or expired session redirects to `/login?next=/account`; non-401 API failures render recovery UI with the backend request ID.
- Authenticated header states for loading, signed out, signed in, logout and account-service failure. Failure never masquerades as signed out.
- A protected account summary with name, email, creation date and active company memberships as read-only names and roles. Seller/admin navigation and unavailable account actions are not exposed.
- Password change, password reset, logout-all, account editing and seller/admin UI remain deferred.

Verification completed on 2026-11-04:

- `git diff --check` passes.
- Backend OpenAPI types match contract (`npm run api:check`).
- Strict lint (`npm run lint`) passes with 0 warnings.
- TypeScript (`npm run typecheck`) passes with 0 errors.
- Vitest unit and component tests (132 tests across 30 test files) all pass.
- Production build (`npm run build`) compiles successfully; `/login`, `/register` and `/account` are request-time routes while public routes retain their existing static/partial-prerender behavior.
- Playwright E2E tests (50 tests across desktop Chromium and mobile Pixel 7) all pass from a standalone development-server startup.
- Production dependency audit (`npm audit --omit=dev`) found 0 vulnerabilities.
- Manual verification against the running Go API confirmed seeded-customer login (200), protected account rendering and session persistence (200), logout (204), and the subsequent `/account` redirect to `/login?next=/account` (307).

## Accepted delivery phases

1. Foundation and API boundary (Complete).
2. Public catalog (Complete on `main`).
3. Product detail and variant resolution (Complete on `main`).
4. Authentication and protected layouts (Complete on `phase-4`).
5. Three.js product preview and KHR material variants.
6. Design creation/list/read-only room rendering.
7. Interactive editor and auto-save.
8. Estimates and quote submission.
9. Customer quote management.
10. Accessibility, performance and production hardening.

Each phase is separately approved, implemented and merged. Seller/admin UI,
collision detection, snapping, undo/redo, payments and orders remain deferred.
