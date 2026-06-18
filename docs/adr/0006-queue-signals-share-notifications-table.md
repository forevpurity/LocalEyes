# ADR 6: Queue Signals share the notifications table but are a distinct concept

A **Notification** is delivered to Citizens only (the bell). A **Queue Signal** tells
Staff a new Report was auto-routed into their Department's queue (the `new_report`
type). These are different concepts serving different actors, but they deliberately
share the `notifications` table, the Socket.io `notification` channel, and the
list/unread endpoints as infrastructure — distinguished only by `type`.

We chose shared infrastructure over a physically separate table + channel + endpoints
because the persistence and transport needs are identical; the only real difference is
*who* is targeted and *why*. Splitting them physically would mean a migration, a second
socket event, and duplicate read endpoints for no behavioural gain.

The cost: a reader who sees `type: "new_report"` rows in the `notifications` table can
wrongly conclude notifications go to Staff — which contradicts CONTEXT.md's "Citizens
only" rule for Notifications. This actually happened and made the glossary stale. This
ADR records the split so the next engineer does not "fix" the apparent inconsistency by
removing the Staff fan-out, nor re-merge the two concepts. The Citizen notification
fan-out rule lives in `features/reports/report-notifications.ts`; the Queue Signal stays
in `create-report.ts` and is intentionally **not** routed through that module.
