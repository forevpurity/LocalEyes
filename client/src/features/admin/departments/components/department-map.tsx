import { useRef, useEffect } from "react";
import {
  MapContainer,
  Polygon,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { Department } from "@/types/api";
import { HCM_CENTER, HCM_BOUNDS } from "@/lib/map-constants";
import { ThemedTileLayer } from "@/lib/themed-tile-layer";

function FlyToDepartment({ department }: { department: Department | null }) {
  const map = useMap();
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (!department || department.id === prevId.current) return;
    prevId.current = department.id;

    const ring = department.polygon.coordinates[0];
    if (!ring || ring.length === 0) return;

    const latLngs = ring.map(([lng, lat]) => [lat, lng] as [number, number]);
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
  }, [department, map]);

  return null;
}

interface DepartmentMapProps {
  departments: Department[];
  selectedDepartmentId: string | null;
  onSelectDepartment: (id: string | null) => void;
}

export function DepartmentMap({
  departments,
  selectedDepartmentId,
  onSelectDepartment,
}: DepartmentMapProps) {
  return (
    <MapContainer
      center={HCM_CENTER}
      zoom={12}
      maxBounds={HCM_BOUNDS}
      className="z-0 h-full w-full"
      zoomControl={false}
    >
      <ThemedTileLayer />

      <FlyToDepartment
        department={
          departments.find((d) => d.id === selectedDepartmentId) ?? null
        }
      />

      {departments.map((dept) => {
        const ring = dept.polygon.coordinates[0];
        if (!ring || ring.length === 0) return null;

        const latLngs = ring.map(
          ([lng, lat]) => [lat, lng] as [number, number],
        );
        const isSelected = selectedDepartmentId === dept.id;

        return (
          <Polygon
            key={dept.id}
            positions={latLngs}
            eventHandlers={{
              click: () => onSelectDepartment(dept.id),
            }}
            pathOptions={{
              fillColor: isSelected ? "#0c56d0" : "#64748b",
              color: isSelected ? "#0c56d0" : "#475569",
              fillOpacity: isSelected ? 0.3 : 0.12,
              weight: isSelected ? 3 : 2,
              dashArray: isSelected ? undefined : "4 4",
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <span className="text-sm font-medium">{dept.name}</span>
            </Tooltip>
          </Polygon>
        );
      })}
    </MapContainer>
  );
}
