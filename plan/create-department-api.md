# Plan: Create Department API

## Overview

Two admin-only endpoints for managing Departments. The Admin drawing tool needs to fetch existing boundaries to avoid overlap while drawing, and a create endpoint that validates the polygon and links Categories atomically.

---

## Endpoints

### `POST /api/departments` (admin-only)

- Protected by `authenticate("admin")`
- Payload:

```json
{
  "name": "District 1",
  "polygon": {
    "coordinates": [[[106.70, 10.78], [106.71, 10.78], [106.71, 10.77], [106.70, 10.77], [106.70, 10.78]]]
  },
  "categories": ["uuid-1", "uuid-2"]
}
```

- Coordinate order: `[longitude, latitude]` (GeoJSON convention). Documented via `.meta({ description })` on the Zod schema.
- Response (201):

```json
{
  "id": "uuid",
  "name": "District 1",
  "polygon": { "coordinates": [[[106.70, 10.78], ...]] },
  "categories": [
    { "id": "uuid-1", "name": "pothole" },
    { "id": "uuid-2", "name": "graffiti" }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `GET /api/departments` (admin-only)

- Protected by `authenticate("admin")`
- Returns all Departments with full polygon + categories data
- Used by Admin drawing tool to overlay existing boundaries on the map
- Returns:

```json
[
  {
    "id": "uuid",
    "name": "District 1",
    "polygon": { "coordinates": [...] },
    "categories": [{ "id": "uuid", "name": "..." }],
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

## Validation & Business Rules

### Name

- Required, non-empty string
- Explicit duplicate check before insert → `ConflictError("Department name already exists")`
- DB `.unique()` constraint as safety net

### Categories

- Required, non-empty array of UUIDs
- All IDs must exist in the database → `ValidationError` with missing IDs listed
- FK constraint on `department_categories` as safety net

### Polygon

- **Outer ring only** — reject interior rings (HCM City districts don't need holes)
- **Closed ring** — first and last coordinate must match
- **Minimum 4 coordinate pairs** — 3 unique points + closing = triangle, the simplest valid polygon
- **Maximum 1000 coordinate pairs** — prevents bloated polygons
- **Non-zero area** — reject collinear points (flattened polygon)
- Coordinate order: `[longitude, latitude]`

### Overlap check

No Department polygon may overlap any existing Department polygon. Checked via:

```sql
ST_Area(ST_Intersection(existing.polygon, ST_SetSRID(new_polygon, 4326))) > 0
```

- `ST_Area` on intersection catches all overlap cases (partial, contained, containing)
- Shared boundaries (intersection is a line) produce `ST_Area = 0` exactly → allowed
- No epsilon needed — GEOS returns exact 0 for boundary touches; `> 0` is unambiguous
- On overlap → `DomainRuleError("Department polygon overlaps with '{existingName}'")`

---

## Files to Create

- `server/src/features/departments/index.ts` — router + OpenAPI doc assembly
- `server/src/features/departments/create-department.ts` — POST handler
- `server/src/features/departments/list-departments.ts` — GET handler

## Files to Modify

- `server/src/index.ts` — mount `departmentsRouter`
