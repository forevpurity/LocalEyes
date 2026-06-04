# ADR 4: Front-end architecture

The client is a standalone Vite + React application with a feature-folder
layout mirroring the server's vertical-slice philosophy from ADR 2. Route
trees are gated by a single layout switch per role (citizen / staff / admin /
public) instead of per-route guard components. The API layer is manual
(hand-written types + a single fetch wrapper with token refresh) rather than
Kubb-generated from the OpenAPI spec — a deliberate deviation from ADR 3 for
v1 to reduce tooling complexity.

## Folder structure

```
client/src/
├── features/           ← domain co-location (component + hook + fetch fn)
│   ├── auth/           ← login-form, register-form, auth-provider,
│   │                      api-interceptor (token refresh)
│   ├── reports/        ← report-map, report-detail, report-form, report-card
│   ├── comments/       ← comment-list, comment-form
│   └── layout/         ← app-shell, navbar, landing page
├── lib/                ← cross-cutting used by 2+ features
│   ├── api.ts          ← fetch wrapper with token refresh interceptor
│   ├── query-client.ts ← QueryClient config + defaults
│   └── socket.ts       ← Socket.io client factory (future)
├── types/
│   └── api.ts          ← shared domain types (Report, User, Comment, ...)
├── routes.ts           ← React Router tree with single layout switch by role
├── providers/          ← QueryClient → Auth → Router assembly
├── components/ui/      ← shadcn primitives (generated)
├── main.tsx
└── index.css
```

**Rule:** if a type or function is consumed by a single feature, it lives
inside that feature folder. Only cross-feature vocabulary lives in `lib/`
or `types/`. Request/response shapes specific to a single endpoint are
defined in the feature file that consumes them (e.g. `SubmitReportInput`
in `features/reports/report-form.tsx`), not in shared `types/`.

## Layout switching by role

A single `AuthProvider` calls `GET /api/auth/me` on mount and exposes the
current user (or null). The route tree switches at the layout level — one
completely separate component tree per role:

- null → Public: landing, read-only map, login, register
- citizen → Citizen: bottom tab bar (Map, My Reports, Notifications, Profile)
- staff → Staff: sidebar dashboard
- admin → Admin: sidebar dashboard (analytics, CRUD, exports)

No per-route `<ProtectedRoute>` wrappers. The role check happens once.

## API layer

Manual fetch types in `types/api.ts` instead of Kubb codegen. Single
`lib/api.ts` wrapper with token refresh: on any 401, calls
`POST /api/auth/refresh` (httpOnly cookie), queues concurrent refreshes,
retries the original request, redirects to `/login` if refresh fails.
Every feature's hook calls through this single tunnel — no raw `fetch`
anywhere else.

## Considered Options

- **Kubb codegen (ADR 3):** originally planned but rejected for v1 to reduce
  tooling complexity for a developer new to the front-end stack.
- **React Router per-route guards:** rejected in favor of a single layout
  switch — fewer components, fewer places for auth logic to drift.
- **MVC-style folder layout** (components/, hooks/, types/): rejected in
  favor of domain co-location, consistent with the server's feature-folder
  approach from ADR 2.
- **npm workspaces / Turborepo:** rejected. The client is a standalone Vite
  project with no link dependency on the server — the contract boundary is
  the API, not shared npm code.

## Consequences

- No shared npm workspace between server and client — types are hand-written
  and can drift from server Zod schemas. Mitigation: server owns the OpenAPI
  spec as reference; drift surfaces as runtime errors.
- The layout-switch-by-role pattern means adding a fourth role (if ever)
  requires touching only `routes.ts` — no route-by-route audit needed.
- Adding dark mode or desktop-adaptive layout later is purely additive
  (Tailwind variants); no rewrite is needed.
- Design tokens (palette, typography, icons) are defined directly in
  Tailwind config and shadcn CSS custom properties — no separate style guide
  file that would drift from the code.
