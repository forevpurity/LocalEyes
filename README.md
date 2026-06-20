# LocalEyes

> A civic issue-reporting platform for Ho Chi Minh City — citizens pin problems on a map, the responsible city department resolves them, and admins manage the whole operation.

<p>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB">
  <img alt="Express 5" src="https://img.shields.io/badge/Express_5-000000?logo=express&logoColor=white">
  <img alt="PostGIS" src="https://img.shields.io/badge/PostGIS-336791?logo=postgresql&logoColor=white">
  <img alt="Socket.io" src="https://img.shields.io/badge/Socket.io-010101?logo=socketdotio&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white">
  <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-green">
</p>

LocalEyes lets a **Citizen** photograph and pin a problem (pothole, broken streetlight,
flooding, graffiti, trash) on a map. The report is **auto-routed to the city Department
whose geographic area contains the pin**, where **Staff** acknowledge it, move it through a
status lifecycle, and resolve it. **Admins** manage departments, categories, users,
moderation, and analytics from a dedicated panel.

Built as an end-to-end product: geospatial routing, real-time notifications, role-based
access, image uploads, moderation tooling, and CSV/GeoJSON data export.

<!-- Live demo: add the URL here once deployed, e.g. **[Live demo →](https://localeyes.vn)** -->

## Screenshots

<!--
📸 Capture checklist — drop the PNGs in docs/screenshots/ and uncomment the block below.
Seed first (see Quickstart) so screens have realistic data.
  1. public-map.png     — public report map, centred on HCM City, with clustered pins
  2. report-detail.png  — a report's detail + comment/status timeline
  3. staff-queue.png    — staff view of their department's report queue
  4. admin-analytics.png— admin dashboard (counts by status/category, trends)

<table>
  <tr>
    <td><img src="docs/screenshots/public-map.png" alt="Public report map"></td>
    <td><img src="docs/screenshots/report-detail.png" alt="Report detail and timeline"></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/staff-queue.png" alt="Staff department queue"></td>
    <td><img src="docs/screenshots/admin-analytics.png" alt="Admin analytics dashboard"></td>
  </tr>
</table>
-->

> _Screenshots coming soon._ Run the Quickstart with the demo seed to see the populated UI.

## Highlights

- **🗺️ PostGIS geo-routing.** Departments are defined by non-overlapping PostGIS polygons.
  A new report is auto-assigned to the department whose area contains its pin via a
  point-in-polygon query; pins outside every polygon land in an **Unassigned Queue** for
  manual assignment. Boundary overlap is rejected at creation/update time.
  → [ADR-0001](docs/adr/0001-postgis-polygon-department-routing.md)

- **🔔 Real-time notifications with the database as source of truth.** Notifications are
  persisted to Postgres (the truth) and pushed over Socket.io as a *best-effort* overlay —
  offline users fetch what they missed on next load. Recipients are scoped per event type,
  and Citizen notifications are kept distinct from Staff "queue signals" even though they
  share table and channel infrastructure.
  → [ADR-0006](docs/adr/0006-queue-signals-share-notifications-table.md)

- **📜 One schema for validation *and* API docs.** A single Zod schema per endpoint drives
  both request/response validation and the auto-generated OpenAPI spec (via `zod-openapi`),
  so the Swagger docs can never drift from the code. Browse them at `/api/docs` in dev.

- **🧱 Vertical-slice architecture.** Feature-per-folder, **one file = one mounted
  endpoint**, with shared domain rules in per-feature `lib/` folders. JWT access/refresh
  tokens in HTTP-only cookies with transparent `401 → refresh → retry`, department-scoped
  staff access, and cursor-based pagination throughout.
  → [ADR-0002](docs/adr/0002-vertical-slice-architecture.md)

## Architecture

```mermaid
flowchart LR
    Browser["Browser<br/>(React 19 + Leaflet)"]

    subgraph Stack["Docker Compose"]
        Caddy["Caddy<br/>TLS / Let's Encrypt"]
        Client["Client<br/>Nginx · static + /api,/uploads,/socket.io proxy"]
        Server["Server<br/>Express 5 + Socket.io"]
        DB[("PostGIS<br/>Postgres 16")]
    end

    R2[("Cloudflare R2<br/>or local /uploads")]

    Browser -->|HTTPS / WSS| Caddy
    Caddy --> Client
    Client -->|/api · /socket.io| Server
    Server --> DB
    Server --> R2
    Server -. "notification / queue signal" .-> Browser
```

The production stack is **Caddy → Nginx (client) → Express (server) → PostGIS**. Caddy
terminates TLS, the client container serves the SPA and proxies API/socket traffic, and the
server talks to PostGIS and to image storage (local disk or Cloudflare R2).

## Tech stack

| Layer | Tech |
| --- | --- |
| **Frontend** | React 19 · Vite · TypeScript · Tailwind CSS 4 · Base UI · React Router · TanStack Query · React Hook Form · Leaflet · Socket.io client · sonner |
| **Backend** | Node ≥22 · Express 5 · TypeScript · Drizzle ORM · Zod + `zod-openapi` · Socket.io · JWT (`jsonwebtoken`) · bcryptjs · Multer · nodemailer · express-rate-limit |
| **Data** | PostgreSQL 16 + PostGIS |
| **Storage** | Local disk or Cloudflare R2 (S3-compatible) |
| **Infra** | Docker Compose · Caddy (TLS) · Nginx |

## Quickstart (Docker)

The fastest way to see LocalEyes running with realistic demo data. Requires Docker.

```bash
git clone <repo-url> LocalEyes
cd LocalEyes

# 1. Create the env file (DOMAIN defaults to localhost → Caddy uses its own local CA)
cp .env.docker.example .env

# 2. Generate the two JWT secrets and paste them into .env
openssl rand -hex 32   # → JWT_ACCESS_SECRET
openssl rand -hex 32   # → JWT_REFRESH_SECRET

# 3. Build and start the stack
docker compose up -d --build

# 4. Push the schema and load the demo seed (the `tools` profile runs on the box,
#    no SSH tunnel needed)
docker compose run --rm tools npm run db:push
docker compose run --rm -e SEED_RESET=true tools npm run db:seed
```

Open **https://localhost** and accept the local-CA certificate warning.

### Demo logins

All seeded accounts share the password **`password123`**.

| Role | Email | What you'll see |
| --- | --- | --- |
| **Admin** | `admin@localeyes.vn` | Full admin panel: departments, categories, users, moderation, analytics, export |
| **Staff** | `staff.d1@localeyes.vn` | District 1's report queue with status/moderation actions |
| **Citizen** | `citizen1@localeyes.vn` | Submit reports, vote, comment, manage subscriptions |

## Development (manual)

For working on the code, run the two packages directly. **Prerequisites:** Node ≥22 and a
PostgreSQL 16 instance with the **PostGIS** extension available.

This is a **two-package repo (no npm workspaces)** — `client/` and `server/` are installed
and run independently.

**Server** (`server/`, serves on port 3000):

```bash
cd server
cp .env.example .env          # set DATABASE_URL + JWT_ACCESS_SECRET + JWT_REFRESH_SECRET
npm install
npm run db:push               # push the Drizzle schema
npm run db:seed               # optional: load demo data
npm run dev                   # tsx watch + live OpenAPI regen
```

**Client** (`client/`, Vite dev server on port 5173, proxies `/api`, `/uploads`,
`/socket.io` to the server):

```bash
cd client
npm install
npm run dev
```

Then open **http://localhost:5173**. Interactive API docs (dev only) are at
**http://localhost:3000/api/docs**.

> There is no test runner configured; the client has `npm run lint` (ESLint). Verify
> changes by running the apps and exercising the Swagger UI. See [AGENTS.md](AGENTS.md) for
> full command reference and conventions.

## Report lifecycle

Every status change requires a note and an explicit confirmation. Reports are never reopened
in normal workflow — a recurring problem is a new report. The one exception is **Admin
correction**, an administrative undo of a mistaken terminal transition.

```mermaid
stateDiagram-v2
    [*] --> submitted
    submitted --> acknowledged
    submitted --> rejected
    submitted --> withdrawn
    acknowledged --> in_progress
    in_progress --> resolved
    resolved --> closed

    rejected --> submitted: admin correction
    closed --> acknowledged: admin correction

    rejected --> [*]
    withdrawn --> [*]
    closed --> [*]
```

`closed`, `rejected`, and `withdrawn` are terminal. `withdrawn` is the Citizen's own choice
and is never reversible, even by an Admin.

## Documentation

| Doc | What it covers |
| --- | --- |
| [CONTEXT.md](CONTEXT.md) | Canonical domain glossary — the ubiquitous language (actors, reports, departments, moderation, notifications). |
| [AGENTS.md](AGENTS.md) | Build/run commands, architecture, and code conventions. |
| [docs/adr/](docs/adr/) | Architecture Decision Records — the *why* behind key technical choices. |

## License

[MIT](LICENSE) © forevpurity
