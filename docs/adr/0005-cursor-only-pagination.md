# ADR 5: Cursor-only pagination (no offset, no total count)

All list endpoints that return potentially large result sets use cursor-based pagination exclusively. No offset-based pagination (`page`/`offset` + `total`) is provided.

## Decision

Response shape for paginated lists:

```json
{ "items": [...], "nextCursor": "eyJjIjoiMjAyNC0wMS0wMSJ9" }
```

For the public map bounding-box query (hard-capped at 200 results):

```json
{ "items": [...], "hasMore": true }
```

The cursor is a base64url-encoded JSON object containing the last seen `createdAt` timestamp and `id`. The next page is fetched with `WHERE (createdAt < cursor) OR (createdAt = cursor AND id < cursor)`, sorted by `createdAt DESC, id DESC`.

No `total` field, no `page` parameter, no `offset` parameter.

## Considered options

- **Offset-based** (`?page=1&limit=20` with `{ items, total }`) — simpler for "jump to page N" dashboards, but `total` requires a `COUNT(*)` query on every request. Offset-based pagination also degrades on large tables (PostgreSQL must scan and skip all preceding rows) and is unstable under inserts (items shift between pages).
- **Cursor-based** (chosen) — no `COUNT(*)` overhead, stable under inserts, natural fit for infinite-scroll mobile lists. The trade-off is no "page 5 of 10" UI, but Staff/Admin dashboards can narrow results with filters (status, category, department) instead of relying on page numbers.
- **Both** — serving two pagination systems from one endpoint adds implementation complexity, divergent test coverage, and two OpenAPI response shapes. Chosen for v1: one pattern only.

## Consequences

- All paginated list endpoints share one pattern: `items` + `nextCursor`.
- No `total` count in any list response. Counts belong in the analytics endpoint (ADR 4, system-wide analytics).
- "Jump to page N" is not supported. If a future Admin dashboard needs this, it would be a separate offset-based endpoint, not an extension of the existing cursor endpoint.
- The cursor is opaque (base64url-encoded). Clients must not parse or construct cursors manually — they pass the `nextCursor` value back as-is.
- Map queries (bounding box) use a hard cap + `hasMore` flag instead of a cursor, since spatial queries don't naturally paginate in a scroll context.
