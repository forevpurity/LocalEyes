# ADR 7: The demo seed is destructive (wipe-and-rebuild), guarded against production

`npm run db:seed` does **not** behave like a normal additive/idempotent seed. Every run
**deletes the entire demo world and rebuilds it from scratch — no exceptions, including the
admin user and Categories** — so the database ends in the same known state regardless of
history. Re-inserting is deterministic (same emails, same shared password, same Category
names); only row UUIDs change, and nothing durable references them. Wiping admin too means
the admin email can change (`admin@example.com` → `admin@localeyes.vn`) without orphaning
the old row, and older dev DBs holding the previous admin row self-heal on the next run.

We chose wipe-and-rebuild over the two alternatives because the seed produces a *rich*
demo dataset (Departments, Reports, status-note trails, votes, comments, subscriptions,
notifications, photos) and a **Report has no natural key**. Additive upsert would therefore
duplicate every Report and all its children on each run. Tag-and-replace (delete only
seed-tagged rows) would preserve hand-made data, but the seed targets a **dedicated
dev/staging environment** with nothing precious to protect, so the per-table tagging
machinery buys nothing. Wipe-and-rebuild is the least code and the most deterministic.

Two consequences a future reader must not "fix":

1. **`db:seed` is destructive on purpose.** It TRUNCATEs/deletes demo tables in FK-safe
   order (reports → department_categories → users → departments → categories; cascades
   clear comments/votes/subscriptions/notifications/photos). This is intended, not a bug.
2. **It hard-refuses to run against production.** Because a destructive seed pointed at
   prod is unrecoverable, the seed bails unless the target is clearly dev/staging
   (`NODE_ENV !== 'production'`, or an explicit `SEED_RESET=true`). Do not remove this
   guard to "make seeding work in prod" — seeding is not meant to run in prod.

Report photos use **stable storage keys** (`reports/seed/<file>`), so a rebuild overwrites
the same ~20 objects in the (dedicated) R2 bucket instead of orphaning them — without that,
each run would leak object storage.
