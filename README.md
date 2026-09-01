# Nurture

Nurture is a privacy-first pregnancy companion designed for women in India.
It provides week-by-week guidance, kick and symptom tracking, appointment
management, and information about Indian maternity benefits.

## Privacy model

- Pregnancy profiles, dates, kicks, symptoms, appointments, and notes stay on
  the user's device.
- Weekly guidance and public maternity-benefit information are API-backed.
- Benefits eligibility checks are stateless.
- Anonymous analytics is optional, allowlisted, identifier-free, and
  aggregate-only.

## Project structure

- `artifacts/nurture-mobile` — Expo mobile application
- `artifacts/nurture` — React and Vite web application
- `artifacts/api-server` — Express API server
- `lib/api-spec` — OpenAPI specification and code generation
- `lib/api-client-react` — generated React API client
- `lib/api-zod` — generated server-side validation schemas
- `lib/db` — PostgreSQL and Drizzle schemas
- `docs` — product requirements, launch checklist, and process-flow diagrams

## Run locally on Replit

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/nurture run dev
pnpm --filter @workspace/nurture-mobile run dev
```

See [`replit.md`](replit.md) for the full architecture and operating notes.

## Process flows

The editable Mermaid diagrams for the user journey, private-data boundary,
benefits eligibility, and anonymous analytics are in
[`docs/nurture-process-flows.md`](docs/nurture-process-flows.md).

## Launch status

Nurture is suitable for a controlled private pilot. Before public launch,
complete the remaining security, medical, legal, store, and operational items
in [`docs/nurture-launch-checklist.md`](docs/nurture-launch-checklist.md).