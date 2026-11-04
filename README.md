# interior_web

Customer frontend for the Interior furniture platform. It uses Next.js App
Router, strict TypeScript, Tailwind CSS and Radix UI. Three.js support arrives
in the dedicated product-preview phase.

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
- Money remains integer minor units and dimensions remain millimetres outside
  the future Three.js rendering boundary.
- Generated API types are never edited manually.

See the backend's `docs/FRONTEND_HANDOFF.md` for the complete cookie, proxy,
OpenAPI, coordinate, GLB and versioning contract.

## Phase workflow

Every phase follows: decisions → plan → approval → `phase-N` branch → verify →
report → developer says `merge`. Never push from the implementation session.
