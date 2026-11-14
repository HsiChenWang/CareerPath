# CareerPath

CareerPath is an AI career companion for USC students and alumni: explore careers, map common alumni journeys, compare skills, and build real relationships through messages, coffee chats, and thoughtful follow-ups.

## Run & operate

- Frontend: managed workflow `artifacts/careerpath: web` at `/`.
- Backend: managed workflow `artifacts/api-server: API Server` at `/api`.
- `pnpm run typecheck` checks all workspace packages.
- `pnpm --filter @workspace/api-spec run codegen` regenerates client hooks and validation schemas.
- `pnpm --filter @workspace/db run push` applies development schema changes. Publish manages production schema.
- Database, session, and AI credentials belong in Replit Secrets; never print their values.

## Product requirements

- USC audience, cardinal `#990000`, gold `#FFCC00`, responsive design.
- Alumni and student records in the demo are fictional. Keep the footer: “Demo uses sample alumni data.”
- The demo is intended for judges to try both sides on separate devices. Alex and Priya have real demo login sessions and shared database-backed interactions, not simulated replies.
- Email/password authentication was explicitly allowed in the brief. Demo credentials are deliberately public; never collect real personal data in shared demo accounts.
- AI must run only on the backend, return validated JSON, and degrade gracefully. Never invent alumni facts or career-path statistics.
- Paths describe sample patterns, not guaranteed or mandatory steps.
- Never expose account emails/password hashes in public person responses. Contact stays inside the app.
- Students: five new alumni introductions per UTC day, one first message until a reply, at most one no-reply nudge per alum.
- Students and alumni control their own coffee-chat actions; availability, pauses, monthly limits, conflicts, blocks, and request ownership are enforced on the server.

## Stack & source of truth

- React/Vite/TypeScript frontend: `artifacts/careerpath/src`.
- Express API: `artifacts/api-server/src/routes`; domain logic in `src/lib`.
- PostgreSQL/Drizzle schema: `lib/db/src/schema`.
- OpenAPI contract: `lib/api-spec/openapi.yaml`. Regenerate after every contract change.
- Fonts/theme: `artifacts/careerpath/src/index.css`.
- AI: Replit AI Integrations for OpenAI, with the provided server client package.

## Architecture decisions

- Public profile JSON is separate from credentials and server-owned state.
- HTTP-only database-backed sessions; salted scrypt password hashes.
- Seed on initial startup idempotently without resetting existing demo interactions.
- Database advisory/row locks serialize first-message quotas, accept decisions, and follow-up sends.
- Demo time affects follow-up due dates, not authentication expiry or real daily message quotas.
- Review AI-written outreach before sending; AI never sends automatically.
- Milestones are persisted into My Gap and relevant alumni follow-up drafts.
- Freshness: messages poll every three seconds, coffee chats every five seconds, network every fifteen seconds.

## Deliberate boundaries

- Calendar export is a downloadable `.ics`; no external calendar connection or video service is implied.
- Meeting location/link details are arranged in Messages.
- Weekly availability expands into eight weeks of specific slots in the alum's local time; alumni can review or remove each slot.
- This is not an official USC service, and sample data is not verified USC alumni information.
