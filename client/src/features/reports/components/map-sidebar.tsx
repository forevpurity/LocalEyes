import { Search } from "lucide-react";
import type { Report, Category, ReportStatus } from "@/types/api";
import { ReportCard } from "./report-card";
import { CategoryChips } from "./category-chips";
import { StatusFilter } from "./status-filter";
import { SortControl, type ReportSort } from "./sort-control";

interface MapSidebarProps {
  selectedReportId: string | null;
  selectedCategory: string | null;
  selectedStatus: ReportStatus | null;
  sortBy: ReportSort;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredReports: Report[];
  categories?: Category[];
  onSelectCategory: (categoryId: string | null) => void;
  onSelectStatus: (status: ReportStatus | null) => void;
  onSortChange: (sort: ReportSort) => void;
  onSelectReport: (report: Report) => void;
}

export function MapSidebar({
  selectedReportId,
  selectedCategory,
  selectedStatus,
  sortBy,
  searchQuery,
  onSearchChange,
  filteredReports,
  categories,
  onSelectCategory,
  onSelectStatus,
  onSortChange,
  onSelectReport,
}: MapSidebarProps) {
  return (
    <div className="flex h-full w-[380px] flex-col border-r border-border bg-surface shadow-xl">
      {/* Header */}
      <div className="space-y-3 border-b border-border bg-muted/30 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-primary">Reports</h2>
            <p className="text-xs text-muted-foreground">
              {filteredReports.length} issue
              {filteredReports.length !== 1 ? "s" : ""} nearby
            </p>
          </div>
          <SortControl value={sortBy} onChange={onSortChange} />
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Category chips */}
        <CategoryChips
          selected={selectedCategory}
          onSelect={onSelectCategory}
          categories={categories}
        />

        {/* Status chips */}
        <StatusFilter selected={selectedStatus} onSelect={onSelectStatus} />
      </div>

      {/* Report list */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {filteredReports.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No reports match your filters.
          </div>
        ) : (
          filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              isSelected={selectedReportId === report.id}
              onClick={onSelectReport}
            />
          ))
        )}
      </div>
    </div>
  );
}
