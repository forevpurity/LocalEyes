import { useMemo, useState } from "react";
import { Link } from "react-router";
import { FileText, Plus, Search } from "lucide-react";
import { Navbar } from "@/features/layout/components/navbar";
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

const OPEN_STATUSES: ReportStatus[] = [
  "submitted",
  "acknowledged",
  "in_progress",
];

type Filter = "all" | ReportStatus;
type Sort = "newest" | "oldest" | "votes";

const SORT_LABELS: Record<Sort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  votes: "Most upvoted",
};

export function MyReportsPage() {
  const { data, isLoading, error } = useMyReports();
  const reports = data?.items ?? [];
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("newest");

  const counts = useMemo(() => {
    const byStatus = {} as Record<ReportStatus, number>;
    for (const report of reports) {
      byStatus[report.status] = (byStatus[report.status] ?? 0) + 1;
    }
    return byStatus;
  }, [reports]);

  const openCount = OPEN_STATUSES.reduce(
    (sum, status) => sum + (counts[status] ?? 0),
    0,
  );
  const resolvedCount = counts.resolved ?? 0;

  const visibleReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = reports.filter((report) => {
      if (filter !== "all" && report.status !== filter) return false;
      if (!query) return true;
      return (
        report.title.toLowerCase().includes(query) ||
        (report.address?.toLowerCase().includes(query) ?? false) ||
        report.categoryName.toLowerCase().includes(query)
      );
    });

    return result.sort((a, b) => {
      if (sort === "votes") return b.voteCount - a.voteCount;
      const delta =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sort === "oldest" ? delta : -delta;
    });
  }, [reports, filter, search, sort]);

  // Only show chips for statuses the citizen actually has reports in.
  const presentStatuses = STATUS_ORDER.filter((status) => counts[status]);

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

          {!isLoading && !error && reports.length > 0 && (
            <>
              <div className="mb-4 grid grid-cols-3 gap-3">
                <StatCard label="Total" value={reports.length} />
                <StatCard label="Open" value={openCount} />
                <StatCard label="Resolved" value={resolvedCount} />
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
                    placeholder="Search by title, location, or category"
                    aria-label="Search your reports"
                    className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  aria-label="Sort reports"
                  className="h-10 shrink-0 appearance-none rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
                >
                  {(Object.keys(SORT_LABELS) as Sort[]).map((value) => (
                    <option key={value} value={value}>
                      {SORT_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <FilterChip
                  label="All"
                  count={reports.length}
                  active={filter === "all"}
                  onClick={() => setFilter("all")}
                />
                {presentStatuses.map((status) => (
                  <FilterChip
                    key={status}
                    label={getStatusStyle(status).label}
                    count={counts[status]}
                    active={filter === status}
                    onClick={() => setFilter(status)}
                  />
                ))}
              </div>
            </>
          )}

          {isLoading ? (
            <p className="py-16 text-center text-muted-foreground">Loading...</p>
          ) : error ? (
            <p className="py-16 text-center text-muted-foreground">
              Failed to load your reports.
            </p>
          ) : reports.length === 0 ? (
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
          ) : visibleReports.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No reports match your search and filters.
            </p>
          ) : (
            <div className="space-y-3">
              {visibleReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-2xl font-bold text-card-foreground">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
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
      <span
        className={cn(
          "text-xs",
          active ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}
