import { useState } from "react";
import { useSearchParams } from "react-router";
import { Loader2, Search, FileText } from "lucide-react";
import { useStaffReports } from "./hooks/use-staff-reports";
import { ReportRow } from "@/features/reports/components/report-row";
import { STATUS_STYLES } from "@/features/reports/lib/status-styles";
import type { ReportStatus } from "@/types/api";

const STATUS_OPTIONS = Object.entries(STATUS_STYLES) as [
  ReportStatus,
  { label: string },
][];

export function StaffQueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<ReportStatus | "">(
    () => (searchParams.get("status") as ReportStatus) ?? "",
  );
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStaffReports({
    status: status || undefined,
    q: q || undefined,
  });

  const reports = data?.items ?? [];

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-headline-sm font-semibold">Queue</h1>
        <p className="text-body-sm text-muted-foreground">
          Reports assigned to your department
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ(search.trim());
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports…"
            className="w-56 rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </form>

        <select
          value={status}
          onChange={(e) => {
            const value = e.target.value as ReportStatus | "";
            setStatus(value);
            if (value) {
              setSearchParams({ status: value });
            } else {
              setSearchParams({});
            }
          }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Report
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Department
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Citizen
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Created
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}

            {error && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-destructive"
                >
                  Failed to load reports.
                  <button
                    onClick={() => window.location.reload()}
                    className="ml-1 underline hover:no-underline"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            )}

            {!isLoading && !error && reports.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  <p className="text-body-md font-medium">No reports found</p>
                  <p className="text-body-sm mt-1">
                    Try adjusting your filters.
                  </p>
                </td>
              </tr>
            )}

            {reports.map((report) => (
              <ReportRow key={report.id} report={report} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {isFetchingNextPage && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
