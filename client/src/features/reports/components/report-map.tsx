import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router";
import L from "leaflet";
import { Search, Plus, Minus, Crosshair, ArrowRight, ThumbsUp } from "lucide-react";
import { useState } from "react";
import type { Report } from "@/types/api";
import { MOCK_REPORTS, getRelativeTime } from "@/features/reports/data/mock-reports";

const HCM_CENTER: [number, number] = [10.7769, 106.7009];
const NOMINATIM = "https://nominatim.openstreetmap.org/search";

const ACTIVE_STATUSES = [
  "submitted",
  "acknowledged",
  "in_progress",
  "resolved",
];

const STATUS_COLORS: Record<string, string> = {
  submitted: "#3b82f6",
  acknowledged: "#8b5cf6",
  in_progress: "#f59e0b",
  resolved: "#10b981",
  closed: "#6b7280",
  rejected: "#ef4444",
};

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

const POPUP_STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  submitted: { bg: "bg-primary/10", text: "text-primary", label: "Submitted" },
  in_progress: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    label: "In Progress",
  },
  resolved: { bg: "bg-green-50", text: "text-green-800", label: "Resolved" },
  acknowledged: {
    bg: "bg-violet-50",
    text: "text-violet-800",
    label: "Acknowledged",
  },
  closed: { bg: "bg-gray-100", text: "text-gray-600", label: "Closed" },
  rejected: { bg: "bg-red-50", text: "text-red-800", label: "Rejected" },
};

function ReportMarker({
  report,
  isHighlighted,
  onClick,
}: {
  report: Report;
  isHighlighted: boolean;
  onClick: (report: Report) => void;
}) {
  const navigate = useNavigate();
  const markerRef = useRef<L.Marker>(null);
  const color = STATUS_COLORS[report.status] ?? "#6b7280";
  const icon = createMarkerIcon(color, isHighlighted);
  const position: [number, number] = [report.latitude, report.longitude];
  const statusStyle = POPUP_STATUS_STYLES[report.status] ?? POPUP_STATUS_STYLES.submitted;
  const photo = report.photos?.[0];

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
      eventHandlers={{
        click: () => onClick(report),
      }}
    >
      <Popup className="report-popup">
        <div className="flex gap-2.5">
          {photo && (
            <img
              src={photo}
              alt=""
              className="mt-0.5 h-[60px] w-[72px] shrink-0 rounded-md border border-border object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-start justify-between gap-1">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide ${statusStyle.bg} ${statusStyle.text}`}
              >
                {statusStyle.label}
              </span>
              <div className="flex shrink-0 items-center gap-0.5 text-muted-foreground">
                <ThumbsUp className="h-3 w-3" />
                <span className="text-[11px] font-medium">{report.voteCount}</span>
              </div>
            </div>
            <div className="mb-0.5 flex items-center gap-1">
              <span className="text-[13px]" aria-hidden="true">
                {report.categoryIcon}
              </span>
              <h3 className="truncate text-xs font-semibold text-primary">
                {report.title}
              </h3>
            </div>
            {report.address && (
              <p className="mb-1.5 truncate text-[11px] text-muted-foreground">
                📍 {report.address}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground/70">
                {getRelativeTime(report.createdAt)}
              </span>
              <button
                onClick={() => navigate(`/reports/${report.id}`)}
                className="flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline"
              >
                View details <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function FlyToController({ reportId }: { reportId: string | null }) {
  const map = useMap();
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (!reportId || reportId === prevId.current) return;
    prevId.current = reportId;

    const report = MOCK_REPORTS.find((r) => r.id === reportId);
    if (report) {
      map.flyTo([report.latitude, report.longitude], 16, { duration: 1 });
    }
  }, [reportId, map]);

  return null;
}

function SearchControl() {
  const map = useMap();
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
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background/90 p-2 shadow-lg backdrop-blur-md">
      <button
        onClick={handleSearch}
        disabled={searching}
        className="shrink-0 rounded-lg p-1 transition-colors hover:bg-muted disabled:opacity-50"
        aria-label="Search location"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
      </button>
      <input
        className="w-56 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
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

  const handleLocate = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, {
          duration: 1.5,
        });
      },
      () => {
        /* denied or error — ignore */
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
        className="rounded-lg p-1.5 transition-colors hover:bg-muted"
        onClick={handleLocate}
        aria-label="My location"
      >
        <Crosshair className="h-4 w-4" />
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
    <div className="absolute bottom-4 left-4 z-[1000] rounded-xl border border-border bg-background/90 px-3 py-2 shadow-lg backdrop-blur-md">
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
      .leaflet-popup-content { margin: 10px !important; width: auto !important; min-width: 240px !important; max-width: 280px !important; }
      .leaflet-popup-tip { box-shadow: none !important; }
      .report-popup .leaflet-popup-content-wrapper { box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important; border: 1px solid hsl(var(--border)) !important; }
      .report-popup .leaflet-popup-content { margin: 12px !important; }
      .report-popup .leaflet-popup-tip { background: hsl(var(--surface)) !important; border: 1px solid hsl(var(--border)) !important; border-top: none !important; border-left: none !important; }
    `;
    document.head.appendChild(style);
  }, []);

  return null;
}

interface ReportMapProps {
  selectedReportId: string | null;
  onSelectReport: (report: Report) => void;
}

export function ReportMap({
  selectedReportId,
  onSelectReport,
}: ReportMapProps) {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={HCM_CENTER}
        zoom={13}
        className="z-0 h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapStyleInjector />
        <FlyToController reportId={selectedReportId} />

        {/* Overlays */}
        <div className="absolute left-4 top-4 z-[1000]">
          <SearchControl />
        </div>
        <div className="absolute right-4 top-4 z-[1000]">
          <MapControls />
        </div>
        <LegendControl />

        {MOCK_REPORTS.filter((r) => ACTIVE_STATUSES.includes(r.status)).map(
          (report) => (
            <ReportMarker
              key={report.id}
              report={report}
              isHighlighted={selectedReportId === report.id}
              onClick={onSelectReport}
            />
          ),
        )}
      </MapContainer>
    </div>
  );
}
