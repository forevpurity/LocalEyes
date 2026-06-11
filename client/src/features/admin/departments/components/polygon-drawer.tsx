import { useState, useCallback, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  CircleMarker,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import type { Department } from "@/types/api";
import { HCM_CENTER, HCM_BOUNDS } from "@/lib/map-constants";

function calcArea(ring: [number, number][]): number {
  // Ring is [longitude, latitude], but area should be calculated in lat/lng space
  // For display purposes only — uses lat/lng directly (not true surface area)
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    // Treat as planar for rough estimate
    area += ring[i][0] * ring[i + 1][1];
    area -= ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(area / 2);
}

function formatArea(area: number): string {
  // Rough conversion: at equator 1 degree ≈ 111km
  // HCM is ~10.8°N, so 1 degree lat ≈ 111km, 1 degree lng ≈ 111 * cos(10.8°) ≈ 109km
  // 1 sq degree ≈ 111 * 109 ≈ 12,100 km²
  const km2 = area * 12100;
  if (km2 >= 1) return `${km2.toFixed(2)} km²`;
  return `${(km2 * 100).toFixed(2)} ha`;
}

interface DrawingControllerProps {
  isDrawing: boolean;
  onClick: (latLng: [number, number]) => void;
}

function DrawingController({ isDrawing, onClick }: DrawingControllerProps) {
  useMapEvents({
    click: (e) => {
      if (isDrawing) {
        onClick([e.latlng.lng, e.latlng.lat]);
      }
    },
  });
  return null;
}

interface PolygonDrawerProps {
  departments: Department[];
  initialPolygon?: { coordinates: [number, number][][] };
  onComplete: (ring: [number, number][]) => void;
  onCancel: () => void;
}

export function PolygonDrawer({
  departments,
  initialPolygon,
  onComplete,
  onCancel,
}: PolygonDrawerProps) {
  const [vertices, setVertices] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleMapClick = useCallback((latLng: [number, number]) => {
    setVertices((prev) => {
      if (prev.length >= 4) {
        const first = prev[0];
        const last = prev[prev.length - 1];
        if (first[0] === last[0] && first[1] === last[1]) {
          return prev;
        }
      }
      return [...prev, latLng];
    });
  }, []);

  const handleUndo = useCallback(() => {
    setVertices((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setVertices([]);
  }, []);

  const handleClose = useCallback(() => {
    setVertices((prev) => {
      if (prev.length < 3) return prev;
      return [...prev, prev[0]];
    });
  }, []);

  const handleFinish = useCallback(() => {
    if (vertices.length < 4) return;
    const first = vertices[0];
    const last = vertices[vertices.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) return;
    if (calcArea(vertices) === 0) return;
    onComplete(vertices);
  }, [vertices, onComplete]);

  const handleStartDrawing = useCallback(() => {
    setIsDrawing(true);
    setVertices([]);
  }, []);

  const handleStopDrawing = useCallback(() => {
    setIsDrawing(false);
    setVertices([]);
    onCancel();
  }, [onCancel]);

  // Dashed line includes preview closing segment if not yet closed
  const linePositions = useMemo(() => {
    if (vertices.length < 2) return [] as [number, number][];
    const converted = vertices.map(
      ([lng, lat]) => [lat, lng] as [number, number],
    );
    return converted;
  }, [vertices]);

  // Fill preview
  const fillPositions = useMemo(() => {
    if (vertices.length < 3) return [] as [number, number][];
    return vertices.map(([lng, lat]) => [lat, lng] as [number, number]);
  }, [vertices]);

  const area = useMemo(() => {
    if (vertices.length < 4) return 0;
    return calcArea(vertices);
  }, [vertices]);

  const isClosed =
    vertices.length >= 4 &&
    vertices[0][0] === vertices[vertices.length - 1][0] &&
    vertices[0][1] === vertices[vertices.length - 1][1];

  const isValid = isClosed && area > 0;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={HCM_CENTER}
        zoom={12}
        maxBounds={HCM_BOUNDS}
        className="z-0 h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <DrawingController isDrawing={isDrawing} onClick={handleMapClick} />

        {/* Existing departments */}
        {departments.map((dept) => {
          const ring = dept.polygon.coordinates[0];
          if (!ring || ring.length === 0) return null;
          const latLngs = ring.map(
            ([lng, lat]) => [lat, lng] as [number, number],
          );
          return (
            <Polygon
              key={dept.id}
              positions={latLngs}
              pathOptions={{
                fillColor: "#f59e0b",
                color: "#d97706",
                fillOpacity: 0.2,
                weight: 2,
                interactive: false,
              }}
            >
              <Tooltip direction="top" opacity={1}>
                <span className="text-sm font-medium">{dept.name}</span>
              </Tooltip>
            </Polygon>
          );
        })}

        {/* Initial polygon (editing mode) — shown when not drawing */}
        {!isDrawing && initialPolygon && (
          <Polygon
            positions={initialPolygon.coordinates[0].map(
              ([lng, lat]) => [lat, lng] as [number, number],
            )}
            pathOptions={{
              fillColor: "#0c56d0",
              color: "#0c56d0",
              fillOpacity: 0.15,
              weight: 2,
              interactive: false,
            }}
          />
        )}

        {/* Drawing polyline (dashed) */}
        {linePositions.length >= 2 && (
          <Polyline
            positions={linePositions}
            pathOptions={{
              color: "#0c56d0",
              weight: 2,
              dashArray: "6 6",
            }}
          />
        )}

        {/* Drawing fill preview */}
        {fillPositions.length >= 3 && (
          <Polygon
            positions={fillPositions}
            pathOptions={{
              fillColor: "#0c56d0",
              color: "#0c56d0",
              fillOpacity: 0.15,
              weight: 0,
            }}
          />
        )}

        {/* Vertex markers */}
        {vertices.map(([lng, lat], i) => {
          const isFirst = i === 0;
          const isCloseable = isFirst && vertices.length >= 3 && !isClosed;
          return (
            <CircleMarker
              key={`${lng}-${lat}-${i}`}
              center={[lat, lng]}
              radius={isFirst ? 7 : 5}
              eventHandlers={
                isCloseable
                  ? {
                      click: (e) => {
                        e.originalEvent.stopPropagation();
                        handleClose();
                      },
                    }
                  : undefined
              }
              pathOptions={{
                fillColor: isFirst ? "#dc2626" : "#0c56d0",
                color: "#ffffff",
                fillOpacity: 1,
                weight: 2,
              }}
            ></CircleMarker>
          );
        })}
      </MapContainer>

      {/* Floating controls */}
      <div className="absolute left-4 top-4 z-1000 flex flex-col gap-2">
        {!isDrawing ? (
          <button
            onClick={handleStartDrawing}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/80"
          >
            Start Drawing
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">
                Drawing Mode
              </span>
              <button
                onClick={handleStopDrawing}
                className="rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>

            <div className="text-label-sm text-muted-foreground">
              Points: {vertices.length - (isClosed ? 1 : 0)}
            </div>

            {area > 0 && (
              <div className="text-label-sm text-muted-foreground">
                Area: {formatArea(area)}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={handleUndo}
                disabled={vertices.length === 0}
                className="rounded-md border border-border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40"
              >
                Undo
              </button>
              <button
                onClick={handleClear}
                disabled={vertices.length === 0}
                className="rounded-md border border-border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40"
              >
                Clear
              </button>
              {!isClosed && vertices.length >= 3 && (
                <button
                  onClick={handleClose}
                  className="rounded-md border border-border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
                >
                  Close Polygon
                </button>
              )}
              {isValid && (
                <button
                  onClick={handleFinish}
                  className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                >
                  Use This Polygon
                </button>
              )}
            </div>

            {isClosed && !isValid && (
              <p className="text-xs text-destructive">Polygon has zero area</p>
            )}
          </div>
        )}

        {/* Hint below controls */}
        {isDrawing && !isClosed && vertices.length >= 3 && (
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-lg">
            <span className="text-lg leading-none text-primary">💡</span>
            <span className="text-sm text-foreground">
              Click the first point to close
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
