import { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Search, Plus, Minus, Crosshair, Loader2, MapPin } from "lucide-react";
import { createPinIcon } from "@/features/reports/lib/leaflet-icons";

const HCM_CENTER: [number, number] = [10.7769, 106.7009];
const HCM_BOUNDS = L.latLngBounds([10.2, 106.2], [11.1, 107.2]);
const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";

function useDisableMapPropagation(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
  }, [ref]);
}

function isWithinBounds(lat: number, lng: number): boolean {
  return HCM_BOUNDS.contains([lat, lng]);
}

function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => {
      onClick(e.latlng.lat, e.latlng.lng);
    };
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, onClick]);

  return null;
}

function SearchBar({
  onResult,
}: {
  onResult: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement>(null);
  useDisableMapPropagation(containerRef);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q || searching) return;
    setSearching(true);
    try {
      const res = await fetch(
        `${NOMINATIM_SEARCH}?format=json&q=${encodeURIComponent(q + ", Ho Chi Minh City, Vietnam")}&limit=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        map.flyTo([lat, lng], 16, { duration: 1 });
        onResult(lat, lng);
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
      className="flex items-center gap-2 rounded-xl border border-border bg-background/95 py-2 px-3 shadow-lg backdrop-blur-md w-full max-w-[calc(100%-7rem)] sm:py-2.5 sm:px-4 sm:max-w-md"
    >
      <button
        onClick={handleSearch}
        disabled={searching}
        className="shrink-0 rounded-full p-1 transition-colors hover:bg-muted disabled:opacity-50"
        aria-label="Search location"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
      </button>
      <input
        className="w-full border-none bg-transparent text-base sm:text-sm outline-none placeholder:text-muted-foreground/60"
        placeholder="Search location..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />
    </div>
  );
}

function MapControls({
  onLocated,
}: {
  onLocated: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement>(null);
  useDisableMapPropagation(containerRef);

  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 16, { duration: 1.5 });
        onLocated(latitude, longitude);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-0.5 rounded-xl border border-border bg-background/90 p-1 shadow-lg backdrop-blur-md"
    >
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
        disabled={isLocating}
        aria-label="My location"
      >
        {isLocating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Crosshair className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

interface PinLocationStepProps {
  initialPin?: { lat: number; lng: number; address: string | null } | null;
  onPinChange: (location: {
    lat: number;
    lng: number;
    address: string | null;
  }) => void;
}

export function PinLocationStep({
  initialPin,
  onPinChange,
}: PinLocationStepProps) {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    initialPin ? { lat: initialPin.lat, lng: initialPin.lng } : null,
  );
  const [address, setAddress] = useState<string | null>(
    initialPin?.address ?? null,
  );

  const [boundsError, setBoundsError] = useState(false);

  // Notify parent when pin/address changes
  useEffect(() => {
    if (pin) {
      onPinChange({ lat: pin.lat, lng: pin.lng, address });
    }
  }, [pin, address, onPinChange]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `${NOMINATIM_REVERSE}?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      setAddress(data.display_name ?? null);
    } catch {
      setAddress(null);
    }
  }, []);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!isWithinBounds(lat, lng)) {
        setBoundsError(true);
        return;
      }
      setBoundsError(false);
      setPin({ lat, lng });
      setAddress(null);
      reverseGeocode(lat, lng);
    },
    [reverseGeocode],
  );

  const handleSearchResult = useCallback(
    (lat: number, lng: number) => {
      if (!isWithinBounds(lat, lng)) {
        setBoundsError(true);
        return;
      }
      setBoundsError(false);
      setPin({ lat, lng });
      setAddress(null);
      reverseGeocode(lat, lng);
    },
    [reverseGeocode],
  );

  const handleLocated = useCallback(
    (lat: number, lng: number) => {
      if (!isWithinBounds(lat, lng)) {
        setBoundsError(true);
        return;
      }
      setBoundsError(false);
      setPin({ lat, lng });
      setAddress(null);
      reverseGeocode(lat, lng);
    },
    [reverseGeocode],
  );

  return (
    <div className="relative w-full">
      <MapContainer
        center={HCM_CENTER}
        zoom={13}
        className="z-0 w-full"
        zoomControl={false}
        style={{ height: "400px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onClick={handleMapClick} />

        {/* Search */}
        <div className="absolute left-0 right-0 top-4 z-1000 flex justify-center">
          <SearchBar onResult={handleSearchResult} />
        </div>

        {/* Map controls */}
        <div className="absolute right-4 top-4 z-1000">
          <MapControls onLocated={handleLocated} />
        </div>

        {pin && <Marker position={[pin.lat, pin.lng]} icon={createPinIcon()} />}
      </MapContainer>

      {/* Address preview below map */}
      <div className="bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin
            className={`h-4 w-4 shrink-0 ${
              boundsError ? "text-destructive" : "text-muted-foreground"
            }`}
          />
          {boundsError ? (
            <span className="text-destructive">
              Please select a location within Ho Chi Minh City.
            </span>
          ) : (
            <span className="min-w-0 truncate text-muted-foreground">
              {pin
                ? (address ?? "Address not available — location recorded")
                : "Tap the map to drop a pin"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
