import { Loader2, FileText, FolderOpen, Inbox, CheckCircle2 } from "lucide-react";
import { Link } from "react-router";
import { useDepartmentSummary } from "./hooks/use-department-summary";
import { useStaffReports } from "./hooks/use-staff-reports";
import { StatCard } from "@/features/admin/analytics/components/stat-card";
import { TrendsLineChart } from "@/features/admin/analytics/components/trends-line-chart";
import { formatResolution } from "@/features/admin/analytics/lib/format-resolution";
import { getRelativeTime } from "@/lib/utils";
import { getStatusStyle } from "@/features/reports/lib/status-styles";
import type { ReportStatus } from "@/types/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const OPEN_STATUSES: ReportStatus[] = [
  "submitted",
  "acknowledged",
  "in_progress",
];

const QUEUE_PREVIEW_LIMIT = 5;

export function StaffDashboardPage() {
  const {
    data,
    isLoading,
    error,
  } = useDepartmentSummary("day");

  const {
    data: reportsData,
    isLoading: reportsLoading,
  } = useStaffReports();

  if (isLoading) {
    return (
      <div
        role="status"
        className="flex h-full items-center justify-center"
      >
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <span className="sr-only">Loading dashboard…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-destructive">
        Failed to load dashboard.
        <button
          onClick={() => window.location.reload()}
          className="ml-1 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const countByStatus = (status: ReportStatus) =>
    data.statusCounts.find((s) => s.status === status)?.count ?? 0;

  const openCount = OPEN_STATUSES.reduce(
    (sum, s) => sum + countByStatus(s),
    0,
  );
  const awaitingReview = countByStatus("submitted");
  const resolvedCount = data.averageResolution.resolvedCount;
  const topCategory =
    data.categoryCounts.length > 0
      ? data.categoryCounts.reduce((a, b) => (a.count > b.count ? a : b))
      : null;

  const queueReports = (reportsData?.items ?? []).slice(0, QUEUE_PREVIEW_LIMIT);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-headline-sm font-semibold">Dashboard</h1>
        <p className="text-body-sm text-muted-foreground">
          Overview of your department's activity
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open reports"
          value={openCount}
          icon={FolderOpen}
          hint={topCategory ? `Top: ${topCategory.categoryName}` : undefined}
        />
        <StatCard
          label="Awaiting review"
          value={awaitingReview}
          icon={Inbox}
        />
        <StatCard
          label="Resolved"
          value={resolvedCount}
          icon={CheckCircle2}
        />
        <StatCard
          label="Avg time to resolve"
          value={formatResolution(data.averageResolution.averageHours)}
        />
      </div>

      {/* Personal stats */}
      <p className="mb-6 text-body-sm text-muted-foreground">
        You resolved{" "}
        <span className="font-medium text-foreground">
          {data.personalStats.reportsResolved}
        </span>{" "}
        reports and added{" "}
        <span className="font-medium text-foreground">
          {data.personalStats.commentsAdded}
        </span>{" "}
        comments.
      </p>

      {/* Trends sparkline */}
      <div className="mb-6">
        <TrendsLineChart
          data={data.reportsOverTime}
          granularity="day"
        />
      </div>

      {/* Queue preview */}
      <Card>
        <CardHeader>
          <CardTitle>Recent reports</CardTitle>
          <CardDescription>
            Latest reports in your department
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div role="status" className="flex justify-center py-8">
              <Loader2
                className="h-5 w-5 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
              <span className="sr-only">Loading reports…</span>
            </div>
          ) : queueReports.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FileText
                className="mx-auto mb-2 h-8 w-8 opacity-40"
                aria-hidden="true"
              />
              <p className="text-body-sm">No reports yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {queueReports.map((report) => {
                const style = getStatusStyle(report.status);
                return (
                  <li key={report.id}>
                    <Link
                      to={`/reports/${report.id}`}
                      className="flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {report.title}
                        </p>
                        <p className="text-label-sm text-muted-foreground">
                          {report.categoryName}
                          {" · "}
                          {report.citizenName ?? "Anonymous"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-label-sm font-medium ${style.bg} ${style.text}`}
                      >
                        {style.label}
                      </span>
                      <span className="shrink-0 text-label-sm text-muted-foreground">
                        {getRelativeTime(report.createdAt)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {queueReports.length > 0 && (
            <div className="mt-3 text-center">
              <Link
                to="/queue"
                className="text-sm font-medium text-primary hover:underline"
              >
                View full queue →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
