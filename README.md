# CareerPath

CareerPath is an AI-assisted career companion for USC students and alumni. It helps students explore sample career journeys, identify skills to build, and connect with alumni for advice and coffee chats.

> CareerPath is an independent demo, not an official USC service. Alumni profiles and career histories shown in the demo are fictional sample data and are not verified outcomes.

## Features

- Explore sample alumni profiles and career journeys.
- Compare a profile with career goals and identify skill gaps.
- Connect, message, request coffee chats, and manage follow-ups.
- Prepare for conversations and draft outreach with AI assistance.
- Upload a resume to suggest profile details, then review and save those details yourself.
- Use the app as a student or an alum with the demo accounts on the sign-in page.

AI-generated text is a draft for the user to review. CareerPath does not send AI-written messages automatically.

## Resume uploads

The Profile page accepts **PDF**, **DOCX**, and **TXT** files up to **4 MB**. PDFs are limited to 8 pages. The importer needs selectable text; scanned, image-only PDFs are not supported.

Uploaded files are processed in memory and are not saved by CareerPath. Email addresses and phone numbers are removed from extracted text before it is sent to the AI provider for profile suggestions. Other resume text is still processed by that provider. Review suggested fields and save your profile when you are ready.

## Technology

- React, TypeScript, Vite, and Tailwind CSS
- Express API and generated TypeScript API client
- PostgreSQL with Drizzle ORM
- Replit AI Integrations for server-side AI features
- pnpm workspace monorepo

## Requirements

- Node.js 24 or newer
- pnpm
- PostgreSQL
- The following environment variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret used to sign session cookies |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Server-side AI integration credential |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Server-side AI integration endpoint |

Keep credentials in Replit Secrets or another environment-variable manager. Do not commit secret values to GitHub.

## Setup

Install dependencies and create or update the database schema:

```bash
pnpm install
pnpm --filter @workspace/db run push
```

The API seeds fictional demo records when it starts. Make sure the environment variables above are configured before starting the services.

### Run in Replit

Use the **Run** button. The project has configured workflows for the web app and API, and Replit routes `/api` requests to the API service.

### Run outside Replit

Start the API and web app in separate terminals:

```bash
PORT=8080 pnpm --filter @workspace/api-server run dev
```

```bash
PORT=18179 BASE_PATH=/ pnpm --filter @workspace/careerpath run dev
```

The web app makes same-origin requests to `/api`. Outside Replit, configure a local reverse proxy to route `/api` to the API server on port `8080`.

## Checks and builds

Type-check the workspace:

```bash
pnpm run typecheck
```

Build the API:

```bash
pnpm --filter @workspace/api-server run build
```

Build the web app:

```bash
PORT=18179 BASE_PATH=/ pnpm --filter @workspace/careerpath run build
```

## Project structure

```text
artifacts/
  api-server/       Express API, authentication, and application routes
  careerpath/       React web application
lib/
  api-spec/         OpenAPI contract
  api-client-react/ Generated React Query client
  api-zod/          Generated request and response validation
  db/               PostgreSQL schema and Drizzle configuration
  integrations-openai-ai-server/
                    Server-side OpenAI-compatible AI integration
```

The OpenAPI contract lives at `lib/api-spec/openapi.yaml`. After changing it, regenerate the API client and validation schemas with:

```bash
pnpm --filter @workspace/api-spec run codegen
```
