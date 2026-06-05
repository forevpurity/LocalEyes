import { useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { Navbar } from "@/features/layout/components/navbar";
import { MapSidebar } from "@/features/reports/components/map-sidebar";
import { ReportMap } from "@/features/reports/components/report-map";
import { CreateReportFab } from "@/features/reports/components/create-report-fab";
import { MobileReportSheet } from "@/features/reports/components/mobile-report-sheet";
import { MOCK_REPORTS } from "@/features/reports/data/mock-reports";
import type { Report } from "@/types/api";

export function MapPage() {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const filteredReports = MOCK_REPORTS.filter((r) => {
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(r.categoryId);
    const matchesSearch =
      searchQuery.trim() === "" ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectReport = (report: Report) => {
    setSelectedReportId(report.id);
  };

  const handleToggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-72px)] w-full">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <MapSidebar
            selectedReportId={selectedReportId}
            selectedCategories={selectedCategories}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filteredReports={filteredReports}
            onToggleCategory={handleToggleCategory}
            onSelectReport={handleSelectReport}
          />
        </div>

        {/* Map */}
        <div className="relative flex-1">
          <ReportMap
            selectedReportId={selectedReportId}
            onSelectReport={handleSelectReport}
          />

          {/* FAB */}
          {isAuthenticated && <CreateReportFab />}
        </div>

        {/* Mobile sheet */}
        <MobileReportSheet
          selectedReportId={selectedReportId}
          selectedCategories={selectedCategories}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filteredReports={filteredReports}
          onToggleCategory={handleToggleCategory}
          onSelectReport={handleSelectReport}
          isOpen={mobileSheetOpen}
          onOpenChange={setMobileSheetOpen}
        />
      </div>
    </>
  );
}
