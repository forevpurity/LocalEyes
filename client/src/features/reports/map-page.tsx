import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router";
import { useAuth } from "@/features/auth/auth-context";
import { Navbar } from "@/features/layout/components/navbar";
import { MapSidebar } from "@/features/reports/components/map-sidebar";
import { ReportMap } from "@/features/reports/components/report-map";
import { CreateReportFab } from "@/features/reports/components/create-report-fab";
import { MobileReportSheet } from "@/features/reports/components/mobile-report-sheet";
import { useMapReports, type BBox, type ViewportChange } from "@/features/reports/hooks/use-map-reports";
import { useCategories } from "@/features/admin/categories/hooks/use-categories";
import { HCM_CENTER, DEFAULT_ZOOM } from "@/lib/map-constants";
import type { Report } from "@/types/api";

function parseUrlViewport(searchParams: URLSearchParams) {
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const zoom = parseInt(searchParams.get("zoom") ?? "", 10);
  return {
    center: [
      isNaN(lat) ? HCM_CENTER[0] : lat,
      isNaN(lng) ? HCM_CENTER[1] : lng,
    ] as [number, number],
    zoom: isNaN(zoom) ? DEFAULT_ZOOM : zoom,
  };
}

export function MapPage() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [searchParams] = useSearchParams();

  const initialViewport = parseUrlViewport(searchParams);

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [bbox, setBbox] = useState<BBox | null>(null);

  const { data, isPlaceholderData } = useMapReports(bbox);
  const { data: categories } = useCategories();

  const filteredReports = useMemo(() => {
    const reports = data?.items ?? [];
    return reports.filter((r) => {
      const matchesCategory =
        selectedCategory === null || r.categoryId === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [data?.items, selectedCategory, searchQuery]);

  const handleViewportChange = useCallback((viewport: ViewportChange) => {
    setBbox(viewport);
    const params = new URLSearchParams();
    params.set("lat", viewport.center[0].toFixed(4));
    params.set("lng", viewport.center[1].toFixed(4));
    params.set("zoom", viewport.zoom.toString());
    window.history.replaceState(null, "", `/map?${params}`);
  }, []);

  const handleSelectCategory = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handleSelectReport = (report: Report) => {
    setSelectedReportId(report.id);
  };

  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-72px)] w-full">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <MapSidebar
            selectedReportId={selectedReportId}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filteredReports={filteredReports}
            categories={categories}
            onSelectCategory={handleSelectCategory}
            onSelectReport={handleSelectReport}
          />
        </div>

        {/* Map */}
        <div className="relative flex-1">
          <ReportMap
            reports={filteredReports}
            selectedReportId={selectedReportId}
            hasMore={data?.hasMore && !isPlaceholderData}
            initialCenter={initialViewport.center}
            initialZoom={initialViewport.zoom}
            onSelectReport={handleSelectReport}
            onViewportChange={handleViewportChange}
          />

          {/* FAB */}
          {isAuthenticated && <CreateReportFab hideOnMobile={mobileSheetOpen} />}
        </div>

        {/* Mobile sheet */}
        <MobileReportSheet
          selectedReportId={selectedReportId}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filteredReports={filteredReports}
          categories={categories}
          onSelectCategory={handleSelectCategory}
          onSelectReport={handleSelectReport}
          isOpen={mobileSheetOpen}
          onOpenChange={setMobileSheetOpen}
        />
      </div>
    </>
  );
}
