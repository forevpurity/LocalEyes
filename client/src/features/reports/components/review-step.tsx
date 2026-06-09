import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { createPinIcon } from "@/features/reports/lib/leaflet-icons";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Shield,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useCreateReport } from "@/features/reports/hooks/use-create-report";
import { useCategories } from "@/features/admin/categories/hooks/use-categories";
import { Button } from "@/components/ui/button";
import type { CoveringResponse } from "@/types/api";
import type { ApiRequestError } from "@/lib/api";

interface ReviewStepProps {
  location: { lat: number; lng: number; address: string | null };
  details: {
    title: string;
    description: string;
    categoryId: string;
    photos: File[];
  };
  covering: CoveringResponse | undefined;
  onBack: () => void;
  onSuccess: (reportId: string) => void;
}

export function ReviewStep({
  location,
  details,
  covering,
  onBack,
  onSuccess,
}: ReviewStepProps) {
  const createReport = useCreateReport();
  const { data: allCategories } = useCategories();

  const categoryName = useMemo(() => {
    const cat =
      covering?.categories.find((c) => c.id === details.categoryId) ??
      allCategories?.find((c) => c.id === details.categoryId);
    return cat?.name ?? "Unknown category";
  }, [covering, allCategories, details.categoryId]);

  const departmentName = covering?.department?.name ?? null;

  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = details.photos.map((f) => URL.createObjectURL(f));
    setPhotoPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleSubmit = () => {
    createReport.mutate(
      {
        title: details.title,
        description: details.description,
        latitude: location.lat,
        longitude: location.lng,
        address: location.address,
        categoryId: details.categoryId,
        photos: details.photos,
      },
      {
        onSuccess: (report) => {
          onSuccess(report.id);
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Review Your Report
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Please double-check the information below before submitting.
          </p>
        </div>

        {/* Mini map + summary */}
        <div className="px-6 pb-6">
          <div className="grid gap-4 md:grid-cols-[1fr_280px]">
            {/* Map */}
            <div className="relative overflow-hidden rounded-xl border border-border">
              <MapContainer
                center={[location.lat, location.lng]}
                zoom={15}
                className="z-0 w-full"
                style={{ height: "220px" }}
                dragging={false}
                scrollWheelZoom={false}
                zoomControl={false}
                touchZoom={false}
                doubleClickZoom={false}
                boxZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={[location.lat, location.lng]}
                  icon={createPinIcon(28)}
                />
              </MapContainer>

              {/* Address overlay */}
              {location.address && (
                <div className="absolute bottom-3 left-3 z-1000 flex items-center gap-1.5 rounded-lg border border-border bg-background/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md max-w-[calc(100%-1.5rem)]">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="min-w-0">{location.address}</span>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Issue Title
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {details.title}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </p>
                <p className="mt-0.5 line-clamp-4 text-sm leading-relaxed text-foreground">
                  {details.description}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </p>
                <p className="mt-0.5 text-sm text-foreground">{categoryName}</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Department
                </p>
                <p className="mt-0.5 text-sm text-foreground">
                  {departmentName ?? (
                    <span className="text-muted-foreground">
                      Unassigned — an admin will assign it
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="px-6 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Evidence Photos ({details.photos.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {photoPreviews.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Evidence ${idx + 1}`}
                className="h-20 w-20 rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        </div>

        {/* Privacy disclaimer */}
        <div className="mx-6 mb-6 flex items-start gap-2 rounded-lg bg-muted/30 px-4 py-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            By submitting, you agree to share this information with Ho Chi Minh
            City Civil Services. Your personal identification is protected and
            will only be shared with authorized council departments.
          </p>
        </div>

        {/* Error */}
        {createReport.error && (
          <div className="mx-6 mb-6 flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {((createReport.error as ApiRequestError).message ??
                "Failed to submit report") + ". Please try again."}
            </span>
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Details
          </Button>
          <Button onClick={handleSubmit} disabled={createReport.isPending}>
            {createReport.isPending ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                Submit Report <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
