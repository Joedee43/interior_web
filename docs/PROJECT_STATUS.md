# Project status — interior_web

**Updated:** 2026-11-08 · **Branch:** `main` (Phase 8 merged locally, not pushed yet; Phase 9 is
uncommitted work awaiting review and "merge") · **Backend contract:** `/v1`, OpenAPI 1.0.0

## Phase 9: customer quote management (built 2026-11-08, awaiting merge)

- `/quotes`: protected, noindex list of the customer's requests, newest first. It has a
  single-status filter kept in the URL (`?status=quoted`), "Load more" with the opaque cursor
  passed back unchanged, list estimate vs quoted total, an expired tag, and empty/error states.
- `/quotes/[requestID]`: lines with list vs quoted prices and maker line notes, charges, totals,
  valid-until/expiry, the maker's note (or decline reason), the customer's contact snapshot,
  and a link to the room. An unknown or foreign request is a 404.
- Actions follow the backend transition table (`availableActions` in `src/lib/quote/status.ts`):
  Accept only when quoted and unexpired; Reject when quoted, even if expired; Cancel while
  pending, reviewing or quoted. Each action is confirmed in a dialog. Accept sends the revision
  shown in that dialog. `stale_revision`, `quote_expired` and `invalid_transition` refetch the
  request and explain what changed. Network failures refetch because the outcome is unknown.
- Entry points: "My quotes" in the account nav (hidden on phones), a card on `/account`, and a
  link on the quote submission success page.
- The mock API mirrors Go: list rows have no `lines`/`charges`, detail always has both, the
  accept checks run in Go's order, and requests are owner-scoped. Four read-only seeded quotes
  exist (pending, quoted r2, expired, accepted). The test-only `POST /__mock/quote-requests` and
  `/__mock/quote-requests/:id/revise` routes give each Playwright test its own quote.
- **Backend dependency:** Phase 9 needs the 2026-11-08 `interior_api` contract fix. Go used to
  omit empty `charges` from quote detail responses, which the strict normalizer rejects. That
  also broke Phase 8's real submission success screen. The same fix makes Go always send
  `is_primary`, `materials` and `variants` on media.

Verification on 2026-11-08: lint (0 warnings), typecheck, and Vitest (248 tests, 56 files) pass.
I mutation-checked the expiry rule. **Not run yet:** Playwright (`tests/e2e/quote-management.spec.ts`
is written), `npm run build`, `npm run api:check`, and a manual run against the real Go API.

## Fixes after Phase 8 (2026-11-08)

A review against the real Go API found and fixed:

- Deleting a design reported an error after it succeeded: Go answers `204` without an ETag (there
  is no next revision), but the frontend required one. The mock API sent one, which hid the bug;
  it now matches Go.
- Adding furniture quickly could drop a piece: every placement shared one save-queue key, so a
  third queued placement replaced the second.
- An edit made while "Save failed" or "Conflict" was showing cleared the error and silently
  discarded the failed change. Later edits now wait until Retry, Review latest or Apply mine.
  A retried item removal no longer duplicates or leaves the item on screen.
- Clicking furniture moved its centre to the click point and saved; dragging snapped the centre
  under the pointer. Both the 3D scene and the 2D plan now keep the grab offset, ignore clicks
  under 4 px of movement and save once on release. The 3D drag ends on any release (it stuck
  when released off the floor); the 2D plan captures the pointer and maps through the
  letterboxed viewBox (non-4:3 rooms were offset).
- Door/window rows kept a removed opening's numbers (uncontrolled inputs keyed by index); they
  now always show the current values.

## Phase 8

Phase 8 is complete and merged into `main`. It delivers:

- Strict quote submission, request, line, snapshot, currency, total, status, revision, date and skipped-item normalization on top of generated OpenAPI operation types.
- A protected, noindex `/designs/[designID]/quote` review route with preserved login return paths, ownership-aware 404s and real backend request IDs.
- Current-price review grouped by maker and currency, with exact SKU/configuration details and unavailable furniture separated as items that will not be submitted.
- Optional, backend-aligned phone, delivery address and maker-note validation plus read-only account name/email snapshots.
- A final pre-submit design refresh that stops when price, variant or availability changed and asks the customer to review the new estimate.
- Explicit confirmation that submissions are separate maker requests, not final quotes, orders or payments.
- Non-retrying TanStack submission with duplicate-click prevention, retained form input, ambiguous-network guidance, 401 auth clearing and rate-limit/validation/request-ID recovery.
- Inline success results with one pending request per maker, submission reference, list-price snapshot and backend-reported skipped products.
- Quote entry points from the read-only design and saved editor; unsaved editors cannot proceed to quoting.
- A stateful mock submission workflow, persisted quote snapshots for Phase 9, multi-maker splitting and desktop/mobile browser coverage.

Verification completed on 2026-11-06:

- `git diff --check` passes.
- Backend OpenAPI types match contract (`npm run api:check`).
- Strict lint (`npm run lint`) passes with 0 warnings.
- TypeScript (`npm run typecheck`) passes with 0 errors.
- Vitest unit and component tests (205 tests across 49 test files) all pass.
- Production build (`npm run build`) compiles successfully; protected design routes render at request time while design detail retains partial prerendering with request-time data.
- Playwright E2E tests pass from a standalone development-server startup: 82 pass and 6 intentional platform-specific cases skip across desktop Chromium and mobile Pixel 7.
- Production dependency audit (`npm audit --omit=dev`) found 0 vulnerabilities.
- Real Go API verification submitted “My living room” to `demo-furniture` and confirmed a pending revision-0 request containing quantity one of `DEMO-CHAIR-GREY` at the 1,850,000-minor-unit ETB snapshot. The exact verification submission was removed afterward. A full seed reset was blocked because unrelated customer designs reference the demo products; no unrelated customer data was deleted.

## Accepted delivery phases

1. Foundation and API boundary (Complete).
2. Public catalog (Complete on `main`).
3. Product detail and variant resolution (Complete on `main`).
4. Authentication and protected layouts (Complete on `main`).
5. Three.js product preview and KHR material variants (Complete on `main`).
6. Design creation/list/read-only room rendering (Complete on `main`).
7. Interactive editor and auto-save (Complete on `main`).
8. Estimates and quote submission (Complete on `main`).
9. Customer quote management (Built, awaiting review and merge).
10. Accessibility, performance and production hardening.

Each phase is separately approved, implemented and merged. Seller/admin UI,
collision detection, snapping, undo/redo, payments and orders remain deferred.
