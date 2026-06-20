import { useEffect, useRef, useCallback } from "react";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Search, Plus, Minus, Crosshair } from "lucide-react";
import { useState } from "react";
import type { Report } from "@/types/api";
import { ReportCard } from "@/features/reports/components/report-card";
import { STATUS_COLORS } from "@/features/reports/lib/status-styles";
import { HCM_CENTER, HCM_BOUNDS, DEFAULT_ZOOM } from "@/lib/map-constants";
import { ThemedTileLayer } from "@/lib/themed-tile-layer";
import type { ViewportChange } from "@/features/reports/hooks/use-map-reports";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";

function createMarkerIcon(color: string, highlighted = false): L.DivIcon {
  const size = highlighted ? 36 : 28;
  const ring = highlighted
    ? `<div class="absolute -inset-1.5 rounded-full opacity-30" style="background:${color};animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite"></div>`
    : "";
  return L.divIcon({
    className: "",
    html: `
      <div class="relative" style="width:${size}px;height:${size}px">
        ${ring}
        <div class="flex items-center justify-center rounded-full shadow-lg border-2 border-white" style="width:${size}px;height:${size}px;background:${color}">
          <div class="w-2 h-2 rounded-full bg-white"></div>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function ReportMarker({
  report,
  isHighlighted,
  onClick,
}: {
  report: Report;
  isHighlighted: boolean;
  onClick: (report: Report) => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  const color = STATUS_COLORS[report.status] ?? "#6b7280";
  const icon = createMarkerIcon(color, isHighlighted);
  const position: [number, number] = [report.latitude, report.longitude];

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
      eventHandlers={{
        click: () => onClick(report),
      }}
    >
      <Popup className="report-popup" closeButton={false} autoPan={false}>
        <ReportCard report={report} />
      </Popup>
    </Marker>
  );
}

function FlyToController({
  reportId,
  reports,
}: {
  reportId: string | null;
  reports: Report[];
}) {
  const map = useMap();
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (!reportId || reportId === prevId.current) return;
    prevId.current = reportId;

    const report = reports.find((r) => r.id === reportId);
    if (report) {
      map.flyTo([report.latitude, report.longitude], 16, { duration: 1 });
    }
  }, [reportId, reports, map]);

  return null;
}

function SearchControl() {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
  }, []);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q || searching) return;
    setSearching(true);
    try {
      const res = await fetch(
        `${NOMINATIM}?format=json&q=${encodeURIComponent(q + ", Ho Chi Minh City, Vietnam")}&limit=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      if (data.length > 0) {
        map.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 16, {
          duration: 1,
        });
        setQuery("");
      }
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-2 rounded-xl border border-border bg-background/90 p-2 shadow-lg backdrop-blur-md"
    >
      <button
        onClick={handleSearch}
        disabled={searching}
        className="shrink-0 rounded-lg p-1 transition-colors hover:bg-muted disabled:opacity-50"
        aria-label="Search location"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
      </button>
      <input
        className="w-56 border-none bg-transparent text-base sm:text-sm outline-none placeholder:text-muted-foreground/60"
        placeholder="Search location..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />
    </div>
  );
}

function MapControls() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    if (locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, {
          duration: 1.5,
        });
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-background/90 p-1 shadow-lg backdrop-blur-md">
      <button
        className="rounded-lg p-1.5 transition-colors hover:bg-muted"
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </button>
      <div className="mx-2 h-px bg-border" />
      <button
        className="rounded-lg p-1.5 transition-colors hover:bg-muted"
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="mx-2 h-px bg-border" />
      <button
        className="rounded-lg p-1.5 transition-colors hover:bg-muted disabled:opacity-50"
        onClick={handleLocate}
        disabled={locating}
        aria-label="My location"
      >
        <Crosshair className={`h-4 w-4 ${locating ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}

function LegendControl() {
  const items = [
    { label: "Submitted", color: STATUS_COLORS.submitted },
    { label: "Acknowledged", color: STATUS_COLORS.acknowledged },
    { label: "In Progress", color: STATUS_COLORS.in_progress },
    { label: "Resolved", color: STATUS_COLORS.resolved },
  ];
  return (
    <div className="absolute bottom-4 left-4 z-1000 rounded-xl border border-border bg-background/90 px-3 py-2 text-foreground shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-3 text-xs font-medium">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function MapStyleInjector() {
  const styleInjected = useRef(false);

  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.2); }
      }
      .leaflet-control-zoom { display: none !important; }
      .leaflet-popup-content-wrapper { border-radius: 10px !important; padding: 0 !important; }
      .leaflet-popup-tip { box-shadow: none !important; }
      .report-popup .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; border: none !important; }
      .report-popup .leaflet-popup-content { margin: 0 !important; width: 348px !important; }
      .report-popup .leaflet-popup-content p { margin: 0 !important; }
      .report-popup .leaflet-popup-tip { background: hsl(var(--card)) !important; box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important; }
    `;
    document.head.appendChild(style);
  }, []);

  return null;
}

function BboxTracker({
  onViewportChange,
}: {
  onViewportChange: (viewport: ViewportChange) => void;
}) {
  const map = useMap();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emit = useCallback(() => {
    const bounds = map.getBounds();
    const center = map.getCenter();
    onViewportChange({
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLng: bounds.getWest(),
      maxLng: bounds.getEast(),
      center: [center.lat, center.lng],
      zoom: map.getZoom(),
    });
  }, [map, onViewportChange]);

  useEffect(() => {
    emit();

    const onMoveEnd = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(emit, 300);
    };

    map.on("moveend", onMoveEnd);
    return () => {
      map.off("moveend", onMoveEnd);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [map, emit]);

  return null;
}

interface ReportMapProps {
  reports: Report[];
  selectedReportId: string | null;
  hasMore?: boolean;
  initialCenter?: [number, number];
  initialZoom?: number;
  onSelectReport: (report: Report) => void;
  onViewportChange: (viewport: ViewportChange) => void;
}

export function ReportMap({
  reports,
  selectedReportId,
  hasMore,
  initialCenter,
  initialZoom,
  onSelectReport,
  onViewportChange,
}: ReportMapProps) {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={initialCenter ?? HCM_CENTER}
        zoom={initialZoom ?? DEFAULT_ZOOM}
        className="z-0 h-full w-full"
        zoomControl={false}
        maxBounds={HCM_BOUNDS}
        maxBoundsViscosity={1.0}
      >
        <ThemedTileLayer />
        <MapStyleInjector />
        <BboxTracker onViewportChange={onViewportChange} />
        <FlyToController reportId={selectedReportId} reports={reports} />

        {/* Overlays */}
        <div className="absolute left-4 top-4 z-1000">
          <SearchControl />
        </div>
        <div className="absolute right-4 top-4 z-1000">
          <MapControls />
        </div>
        <LegendControl />

        {reports.map((report) => (
          <ReportMarker
            key={report.id}
            report={report}
            isHighlighted={selectedReportId === report.id}
            onClick={onSelectReport}
          />
        ))}
      </MapContainer>

      {hasMore && (
        <div className="absolute left-1/2 top-4 z-1000 -translate-x-1/2 rounded-full border border-border bg-background/90 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur-md">
          Zoom in for more results
        </div>
      )}
    </div>
  );
}
