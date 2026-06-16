import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  Search,
  Timer,
} from "lucide-react";
import { Navbar } from "@/features/layout/components/navbar";
import { useCategories } from "@/features/admin/categories/hooks/use-categories";
import { StatCard } from "@/features/admin/analytics/components/stat-card";
import { formatResolution } from "@/features/admin/analytics/lib/format-resolution";
import { ReportCard } from "@/features/reports/components/report-card";
import { useMyReports } from "@/features/reports/hooks/use-my-reports";
import type { ReportsScope } from "@/features/reports/hooks/use-my-reports";
import { useMyStats } from "@/features/reports/hooks/use-my-stats";
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
  const navigate = useNavigate();
  const [scope, setScope] = useState<ReportsScope>("mine");
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const { data: categories } = useCategories();
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const activeStatus = filter === "all" ? undefined : filter;
  const activeCategoryId = categoryId === "all" ? undefined : categoryId;
  const hasActiveFilters =
    filter !== "all" ||
    activeCategoryId !== undefined ||
    debouncedSearch.length > 0;
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMyReports(scope, {
    status: activeStatus,
    q: debouncedSearch || undefined,
    categoryId: activeCategoryId,
  });
  const reports = data?.items ?? [];

  const { data: stats } = useMyStats({ enabled: scope === "mine" });
  const resolved = stats?.averageResolution.resolvedCount ?? 0;
  const open =
    stats?.statusCounts
      .filter((s) =>
        ["submitted", "acknowledged", "in_progress"].includes(s.status),
      )
      .reduce((sum, s) => sum + s.count, 0) ?? 0;
  const avgHours = stats?.averageResolution.averageHours ?? null;
  const hasResolved = stats && stats.averageResolution.resolvedCount > 0;

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-72px)] bg-surface-container-low">
        <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-card-foreground md:text-headline-lg">
                {scope === "mine" ? "My Reports" : "Following"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {scope === "mine"
                  ? "Reports you've submitted to your local authorities."
                  : "Reports you're following for updates."}
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

          <div className="mb-4 inline-flex rounded-lg border border-border bg-card p-1">
            <ScopeTab
              label="Mine"
              active={scope === "mine"}
              onClick={() => setScope("mine")}
            />
            <ScopeTab
              label="Following"
              active={scope === "subscribed"}
              onClick={() => setScope("subscribed")}
            />
          </div>

          {scope === "mine" && stats && (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="Total"
                value={stats.totalReports}
                icon={FileText}
              />
              <StatCard label="Resolved" value={resolved} icon={CheckCircle2} />
              <StatCard label="Open" value={open} icon={Clock} />
              {hasResolved && (
                <StatCard
                  label="Avg. fix"
                  value={formatResolution(avgHours)}
                  icon={Timer}
                />
              )}
            </div>
          )}

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
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              aria-label="Filter your owned reports by status"
              className="h-10 shrink-0 appearance-none rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 sm:w-52"
            >
              <option value="all">All statuses</option>
              {STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {getStatusStyle(status).label}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <p className="py-16 text-center text-muted-foreground">
              Loading...
            </p>
          ) : error ? (
            <p className="py-16 text-center text-muted-foreground">
              Failed to load your reports.
            </p>
          ) : reports.length === 0 && !hasActiveFilters ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card py-16 text-center">
              <FileText
                className="h-8 w-8 text-muted-foreground"
                aria-hidden="true"
              />
              {scope === "mine" ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    You haven't filed any reports yet.
                  </p>
                  <Link
                    to="/reports/new"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Report an issue
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    You're not following any reports yet.
                  </p>
                  <Link
                    to="/map"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Explore the map
                  </Link>
                </>
              )}
            </div>
          ) : reports.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No reports match your search and filters.
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {reports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onClick={(r) => navigate(`/reports/${r.id}`)}
                  />
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

function ScopeTab({
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
      aria-pressed={active}
      className={cn(
        "rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
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
