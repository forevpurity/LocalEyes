# ADR 1: PostGIS polygon areas for Department routing

Reports are routed to Departments by matching the Citizen's pinned map location against Department boundaries. We store Department areas as PostGIS polygon geometry columns and query them with `ST_Contains`. Bounding-box matching (min/max lat/lng) would have been simpler to implement and required no spatial extension, but HCM City districts have irregular boundaries that don't fit rectangular boxes — polygons avoid false positives where a pin falls inside a box but outside the actual district. The Admin polygon-drawing UI (Leaflet Draw → WKT) makes polygon creation practical without GIS expertise. Adopting PostGIS carries a setup cost (extension, spatial indexing) and locks us into PostgreSQL, but the routing accuracy justifies it and we already committed to PostgreSQL.

##  Considered options

- **Bounding boxes** per Department — simpler, no PostGIS needed, but inaccurate for irregular district shapes
- **Pre-computed grid cells** — assign each cell to a Department, then snap pins to the nearest cell. More complex, equally brittle
- **PostGIS polygons** (chosen) — accurate, standard tool for this problem, pairs naturally with Leaflet Draw

## Consequences

- PostgreSQL becomes a hard dependency (no SQLite swap)
- Spatial index on the polygon column is required for performance as the map grows
- Admin polygon drawing requires client-side Leaflet Draw integration
- Point-in-polygon lookups are a single query and remain fast even with hundreds of Departments
