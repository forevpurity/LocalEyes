import { MapContainer, Marker } from "react-leaflet";
import L from "leaflet";
import { ThemedTileLayer } from "@/lib/themed-tile-layer";
import { MapPin } from "lucide-react";
import { getStatusColor } from "@/features/reports/lib/status-styles";
import type { ReportDetail } from "@/types/api";

function pinIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-lg" style="background:${color}"><div class="h-2 w-2 rounded-full bg-white"></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function ReportLocationCard({ report }: { report: ReportDetail }) {
  const position: [number, number] = [report.latitude, report.longitude];

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        Map Location
      </div>
      <MapContainer
        center={position}
        zoom={15}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{ height: "12rem", width: "100%" }}
      >
        <ThemedTileLayer />
        <Marker position={position} icon={pinIcon(getStatusColor(report.status))} />
      </MapContainer>
      {report.address && (
        <p className="border-t border-border px-4 py-3 text-xs leading-5 text-on-surface-variant">
          {report.address}
        </p>
      )}
    </section>
  );
}
