import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Report, Category } from "@/types/api";
import { ReportCard } from "./report-card";
import { CategoryChips } from "./category-chips";

interface MobileReportSheetProps {
  selectedReportId: string | null;
  selectedCategory: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredReports: Report[];
  categories?: Category[];
  onSelectCategory: (categoryId: string | null) => void;
  onSelectReport: (report: Report) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileReportSheet({
  selectedReportId,
  selectedCategory,
  searchQuery,
  onSearchChange,
  filteredReports,
  categories,
  onSelectCategory,
  onSelectReport,
  isOpen,
  onOpenChange,
}: MobileReportSheetProps) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[1000] flex h-[85vh] flex-col rounded-t-2xl border-t border-border bg-surface shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out md:hidden ${
        isOpen ? "translate-y-0" : "translate-y-[calc(100%-80px)]"
      }`}
    >
      {/* Handle */}
      <button
        onClick={() => onOpenChange(!isOpen)}
        className="flex w-full items-center justify-center py-3"
        aria-label={isOpen ? "Collapse report sheet" : "Expand report sheet"}
      >
        <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
      </button>

      {/* Header */}
      <div className="space-y-3 px-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-primary">Reports</h2>
            <p className="text-xs text-muted-foreground">
              {filteredReports.length} issue
              {filteredReports.length !== 1 ? "s" : ""} nearby
            </p>
          </div>
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
      </div>

      {/* List */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-6 pt-2">
        {filteredReports.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No reports match your filters.
          </div>
        ) : (
          filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              isSelected={selectedReportId === report.id}
              onClick={(r) => {
                onSelectReport(r);
                onOpenChange(false);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
