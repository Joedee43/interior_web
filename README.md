# interior_web

Customer frontend for the Interior furniture platform. It uses Next.js App
Router, strict TypeScript, Tailwind CSS, Radix UI and a demand-rendered
React Three Fiber product preview.

The Go API lives in the sibling `interior_api` repository. Browser requests
use same-origin `/v1/*` paths; Next.js rewrites them to `API_INTERNAL_URL`.

## Setup

Requirements: Node 24 and the migrated `interior_api` development database.

```bash
cp .env.local.example .env.local
npm ci
npm run api:generate
npm run dev
```

Open `http://localhost:3000`. Run the backend on `http://localhost:5050` or
change `API_INTERNAL_URL`.

## Commands

```bash
npm run dev          # Next.js development server
npm run lint         # ESLint, no warnings allowed
npm run typecheck    # strict TypeScript
npm run test         # Vitest + Testing Library
npm run test:e2e     # Playwright desktop/mobile projects with a local mock API
npm run api:generate # regenerate types from the sibling Go OpenAPI file
npm run api:check    # fail when generated types are stale
npm run build        # production build (Webpack; dev uses Turbopack)
npm run check        # lint + types + unit tests + build
```

Playwright needs a local browser once: `npx playwright install chromium`.

## Architecture rules

- Pages and layouts are Server Components unless interactivity requires a
  narrow client boundary.
- Public catalog/product pages fetch Go directly from Server Components.
  They do not use TanStack Query.
- One stable TanStack Query provider shares authenticated client state. Query
  usage remains limited to auth, designs, editor persistence and quotes; public
  catalog and product data stays in Server Components.
- `API_INTERNAL_URL` is server-only. Browser code calls relative `/v1/*` URLs
  with credentials.
- Server API calls forward the cookie, omit Origin, validate one client IP from
  a trusted platform header and overwrite both forwarding headers.
- Money remains integer minor units. Catalog dimensions remain millimetres and
  are converted to metres only at the Three.js rendering boundary; models are
  never resized to force a match.
- Generated API types are never edited manually.

## Product 3D previews

Products with a GLB expose accessible Photos and 3D tabs. Desktop activates 3D
after hydration; mobile waits for an explicit customer selection before it
downloads the model. Preview materials use exact, case-sensitive
`KHR_materials_variants` names matching backend variant SKUs. Orbit, zoom and
reset are manual. WebGL, model and contract failures fall back to product
imagery without blocking configuration, pricing or product information.

## Saved room designs

Authenticated customers can list paginated saved designs, create a room from a
published template or exact metre-based custom dimensions, and open a read-only
room at `/designs/[designID]`. The room renderer keeps API data in millimetres
and converts only at the Three.js boundary: X points east, Z points south, Y
points up, and positive rotation is counter-clockwise from above. Desktop loads
the demand-rendered room automatically; mobile keeps GLBs deferred behind
“Load 3D room” and shows a lightweight floor plan first. Item-level model or
variant failures use dimensionally correct placeholders without hiding room,
furniture, availability, or estimate information.

## Interactive room editor

`/designs/[designID]/edit` adds conflict-safe editing on top of the read-only
room. Desktop customers select and drag furniture in Three.js; mobile customers
edit in a lightweight top-down plan without downloading GLBs. Exact numeric
controls cover position and positive counter-clockwise rotation. Room finishes,
dimensions, doors and windows are editable, and a Radix drawer supplies
searchable, paginated catalog placement with available variants only.

All design and furniture writes are serialized through one optimistic queue and
carry the latest aggregate `If-Match` ETag. The editor retains local work after
failures, exposes backend request IDs, supports retries, and pauses for an
explicit review or reapply decision when another tab or device has changed the
room. Furniture is clamped by its rotated rectangular footprint; overlap between
furniture remains intentionally allowed.

See the backend's `docs/FRONTEND_HANDOFF.md` for the complete cookie, proxy,
OpenAPI, coordinate, GLB and versioning contract.

## Phase workflow

Every phase follows: decisions → plan → approval → `phase-N` branch → verify →
report → developer says `merge`. Never push from the implementation session.
