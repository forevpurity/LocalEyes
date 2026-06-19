# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

LocalEyes is a civic issue-reporting platform for HCM City. Citizens pin reports
(potholes, broken lights, graffiti) on a map; staff in the responsible department
acknowledge and resolve them; admins manage users, departments, categories, and
moderation. See `CONTEXT.md` for canonical domain terminology and the report lifecycle.

It is a **two-package repo (no npm workspaces)**: `client/` and `server/` each have
their own `package.json` and are installed/run independently.

## Commands

Run all commands from inside the relevant package directory.

### server/ (Express 5 + Drizzle + PostgreSQL, ES modules, TypeScript 5)

- `npm run dev` — tsx watch on `src/index.ts` + live OpenAPI regen (concurrently). Serves on `PORT` (default 3000).
- `npm run build` / `npm start` — `tsc` to `dist/`, then `node dist/index.js`.
- `npm run db:push` — push Drizzle schema to Postgres (no migration files needed for local dev).
- `npm run db:studio` — Drizzle Studio GUI.
- `npm run db:seed` — seed data (`src/db/seeds/seed.ts`).
- `npm run openapi` — regenerate the OpenAPI spec.
- No lint script and no test runner are configured on the server.

### client/ (React 19 + Vite + Tailwind 4, TypeScript 6)

- `npm run dev` — Vite dev server on port 5173. Proxies `/api`, `/uploads`, and `/socket.io` to `http://localhost:3000`, so run the server too.
- `npm run build` — `tsc -b && vite build`.
- `npm run lint` — ESLint (flat config). This is the only lint/check command in the repo.
- `npm run preview` — preview the production build.

### Tests

No test runner (Jest/Vitest/Mocha) is configured anywhere. Verify changes by running
the apps and, for the API, the Swagger UI (dev only) at `/api/docs`.

### Environment

The server needs a `.env` (see `server/.env.example`): `DATABASE_URL`,
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, plus token TTL/max-age vars. `NODE_ENV`
gates Swagger UI (dev only). PostGIS must be available in the Postgres instance.

## Architecture

### Backend (`server/src/`)

- `index.ts` — Express app, Socket.io init, router mounting, error/404 middleware.
- `common/` — cross-cutting: `auth.ts` (`authenticate(...roles)`, `optionalAuthenticate()`),
  `socket.ts` (Socket.io server; auth handshake reads the same JWT cookies, stores actor
  on `socket.data`), `token-utils.ts`, `errors.ts` (`AppError` hierarchy), `validate.ts`
  (Zod), `geo.ts` (PostGIS helpers), `pagination.ts`.
- `db/` — `client.ts` (Drizzle + pg pool), `schema/` (tables: users, reports, departments,
  categories, subscriptions, notifications, comments, votes, report-photos), `seeds/`.
- `features/<name>/` — **feature-per-folder; one route action per file.** Each top-level
  file exports a function that takes the `router` and mounts a handler, plus a Zod-based
  OpenAPI doc object; `index.ts` mounts them all. Shared, non-route helpers (domain rules,
  projections, schemas, guards) live in an optional `lib/` subfolder so the top level reads
  as "one file = one mounted endpoint." See `features/reports/` (route actions like
  `update-report-status.ts`, `toggle-subscribe.ts`; helpers under `lib/` like
  `report-rules.ts`, `enforce-staff-scope.ts`) as the canonical example.

Key conventions:

- **Auth**: JWT access (~15m) + refresh (~7d) tokens in HTTP-only cookies. `POST /auth/refresh`
  issues new access tokens.
- **Staff scoping**: staff only see their department's reports via `enforce-staff-scope.ts`.
- **Validation + docs are unified**: request/response Zod schemas drive both validation and
  the auto-generated OpenAPI spec (`zod-openapi`). Update schemas, not hand-written docs.
- **Multi-step writes** (status change + status-note comment + notifications) run inside a
  Drizzle `db.transaction()`.

### Frontend (`client/src/`)

- `providers/index.tsx` — QueryClientProvider, Router, AuthProvider.
- `lib/api.ts` — fetch wrapper with transparent 401→refresh→retry and error parsing.
- `lib/socket.ts` — singleton Socket.io client (`getSocket()` / `disconnectSocket()`).
- `lib/query-client.ts` — React Query config (~30s staleTime).
- `routes/` — role-gated routing: `public-routes`, `citizen-routes`, `staff-routes`, `admin-routes`.
- `features/<name>/` — colocated hooks/components (auth, reports, notifications, admin, layout, profile).
- `types/api.ts` — shared API response types.
- For client-side user feedback conventions (toast vs inline/banner error, and avoiding duplicate error surfacing), follow `docs/adr/0004-frontend-architecture.md`.

### Real-time notifications (end-to-end)

1. A report event (e.g. `PATCH /reports/:id/status`) calls `notify()` in
   `features/notifications/notify.ts`, which inserts notification rows (DB is the source of
   truth) and best-effort emits a `"notification"` event to `user:<recipientId>` Socket.io rooms.
2. Recipients are the report's **subscribers** (`subscriptions` table). Report owners are
   auto-subscribed and cannot unsubscribe; others toggle via `PATCH /reports/:id/subscribe`.
3. On the client, `useNotificationSocket()` (mounted in the Navbar) shows a toast (`sonner`),
   bumps the unread count, and invalidates React Query caches.

> Notification preference: use broad `["reports"]` query invalidation rather than predicate-based
> invalidation (per existing project convention).
