import { useEffect, useState } from "react";
import { Link } from "react-router";
import { FileText, Plus, Search } from "lucide-react";
import { Navbar } from "@/features/layout/components/navbar";
import { useCategories } from "@/features/admin/categories/hooks/use-categories";
import { ReportCard } from "@/features/reports/components/report-card";
import { useMyReports } from "@/features/reports/hooks/use-my-reports";
import { getStatusStyle } from "@/features/reports/lib/status-styles";
import { cn } from "@/lib/utils";
import type { ReportStatus } from "@/types/api";

const STATUS_ORDER: ReportStatus[] = [
  "submitted",
  "acknowledged",
  "in_progress",
  "resolved",
  "closed",
  "rejected",
  "withdrawn",
];

type Filter = "all" | ReportStatus;

export function MyReportsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const { data: categories } = useCategories();
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const activeStatus = filter === "all" ? undefined : filter;
  const activeCategoryId = categoryId === "all" ? undefined : categoryId;
  const hasActiveFilters =
    filter !== "all" || activeCategoryId !== undefined || debouncedSearch.length > 0;
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMyReports(
    {
      status: activeStatus,
      q: debouncedSearch || undefined,
      categoryId: activeCategoryId,
    },
  );
  const reports = data?.items ?? [];

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-72px)] bg-surface-container-low">
        <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-card-foreground md:text-headline-lg">
                My Reports
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Reports you've submitted to your local authorities.
              </p>
            </div>
            <Link
              to="/reports/new"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New report
            </Link>
          </div>

          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title"
                aria-label="Search your owned reports by title"
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              aria-label="Filter your owned reports by category"
              className="h-10 shrink-0 appearance-none rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 sm:w-52"
            >
              <option value="all">All categories</option>
              {(categories ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <FilterChip
              label="All"
              active={filter === "all"}
              onClick={() => setFilter("all")}
            />
            {STATUS_ORDER.map((status) => (
              <FilterChip
                key={status}
                label={getStatusStyle(status).label}
                active={filter === status}
                onClick={() => setFilter(status)}
              />
            ))}
          </div>

          {isLoading ? (
            <p className="py-16 text-center text-muted-foreground">Loading...</p>
          ) : error ? (
            <p className="py-16 text-center text-muted-foreground">
              Failed to load your reports.
            </p>
          ) : reports.length === 0 && !hasActiveFilters ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card py-16 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                You haven't filed any reports yet.
              </p>
              <Link
                to="/reports/new"
                className="text-sm font-medium text-primary hover:underline"
              >
                Report an issue
              </Link>
            </div>
          ) : reports.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No reports match your search and filters.
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {reports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
              {hasNextPage && (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-card-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isFetchingNextPage ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
