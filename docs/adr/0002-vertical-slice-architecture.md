# ADR 2: Vertical slice architecture (feature-folders)

The server uses feature-folders inside `src/features/` instead of the classic Express MVC layering (controllers, services, repositories). Each slice is a vertical slice: a self-contained directory with its own use-case files, validation schemas, and business logic. Use-case files follow a self-registering pattern — each exports a named function that mounts its route on a shared Router. Cross-cutting concerns (auth, validation, error handling, DB client, geo helpers) live in `src/common/`. Drizzle table definitions live in `src/db/schema/` for migration tooling convenience.

We chose this over MVC (which scatters related logic across folders) and over convention-based routing (which relies on magic filename parsing that's hard to grep and debug). The per-slice index file acts as an explicit manifest — greppable, no surprises, one import per use-case.

## Folder structure

```
server/src/
├── db/
│   ├── schema/       ← Drizzle table defs (all tables, one place)
│   ├── client.ts     ← drizzle instance
│   └── migrate.ts
├── common/           ← auth.ts, validate.ts, errors.ts, geo.ts, pagination.ts
├── features/
│   └── reports/
│       ├── index.ts          ← imports + mounts all use-cases on reportsRouter
│       ├── create-report.ts  ← export fn createReport(router) { ... } + schema + handler
│       ├── resolve-report.ts
│       ├── vote-report.ts
│       └── ...
│   └── departments/
│   └── comments/
│   └── votes/
│   └── subscriptions/
│   └── notifications/
│   └── ...
└── index.ts           ← app.use("/api", reportsRouter) etc.
```

## AuthN vs AuthZ split

- **AuthN (who you are)** — Express middleware in `common/auth.ts`. Parses JWT, loads the actor, gates broad roles (`authenticate("citizen")`).
- **AuthZ (are you allowed to do this thing)** — Inside the use-case handler. Domain-specific checks like "Staff can only touch their own Department's Reports" can't be expressed generically in middleware.

