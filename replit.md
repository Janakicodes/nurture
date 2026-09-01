# Nurture — Pregnancy Companion

A trusted, privacy-first pregnancy companion app for Indian users. Provides weekly guidance, symptom and kick tracking, appointment management, and government maternity benefit awareness.

## Run & Operate

- `pnpm --filter @workspace/nurture run dev` — run the frontend (port 22205, preview at `/`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, preview at `/api`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + wouter (routing)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- OpenAPI spec: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/` (profile, weeklyContent, symptoms, kicks, appointments, benefits)
- API routes: `artifacts/api-server/src/routes/` (profile, weeklyContent, symptoms, kicks, appointments, benefits, dashboard, admin)
- Frontend: `artifacts/nurture/src/`
- Generated hooks: `lib/api-client-react/src/generated/api.ts`
- Generated Zod schemas: `lib/api-zod/src/generated/api/api.ts`

## Architecture decisions

- Single profile model (no auth) — privacy-first, locally stored profile with no user accounts
- Due date calculation: accepts either LMP or due date, normalises to due date on the server
- Orval zod output uses `workspace: generated/` + post-codegen script to fix barrel file (avoids TypeScript duplicate export error)
- Dashboard summary is a computed endpoint — aggregates profile + weekly content + kick/symptom/appointment counts in one call
- Eligibility checker is server-side rule engine based on Indian scheme criteria

## Product

Nurture helps pregnant women in India know exactly what to do each week. Core features:
- Weekly guidance dashboard (baby development, mother changes, weekly actions, nutrition tips, warning symptoms)
- Symptom tracker with predefined chips and severity
- Kick counter with daily session tracking
- Appointment manager with type, doctor, location, and reminder support
- India maternity benefits module (PMMVY, ESIC, Maternity Benefit Act, JSY, ASHA support) with eligibility checker
- Admin dashboard with analytics and weekly content management

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`
- The codegen script auto-fixes `lib/api-zod/src/generated/index.ts` and `lib/api-zod/src/index.ts` after orval runs (see `lib/api-spec/package.json`)
- `date-fns` must be in api-server dependencies (it's a runtime dep for due date calculation)
- Zod schemas are at `lib/api-zod/src/generated/api/api.ts` (note the double `api/api` path from orval config change)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
