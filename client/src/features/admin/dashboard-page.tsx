import { Loader2, FileText, FolderOpen, MapPinOff, Inbox } from "lucide-react";
import { useAnalyticsSummary } from "./analytics/hooks/use-analytics-summary";
import { useAdminReports } from "./reports/hooks/use-admin-reports";
import { StatCard } from "./analytics/components/stat-card";
import { RecentReportsList } from "./dashboard/recent-reports-list";
import type { ReportStatus } from "@/types/api";

const OPEN_STATUSES: ReportStatus[] = [
  "submitted",
  "acknowledged",
  "in_progress",
];

const RECENT_LIMIT = 8;

export function AdminDashboard() {
  const { data, isLoading, error } = useAnalyticsSummary("day");
  const {
    data: reportsData,
    isLoading: reportsLoading,
  } = useAdminReports();

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

  const openCount = OPEN_STATUSES.reduce((sum, s) => sum + countByStatus(s), 0);
  const unassignedCount =
    data.departmentCounts.find((d) => d.departmentId === null)?.count ?? 0;
  const awaitingReview = countByStatus("submitted");

  const recentReports = (reportsData?.items ?? []).slice(0, RECENT_LIMIT);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-headline-sm font-semibold">Dashboard</h1>
        <p className="text-body-sm text-muted-foreground">
          Overview of system activity
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total reports" value={data.totalReports} icon={FileText} />
        <StatCard label="Open reports" value={openCount} icon={FolderOpen} />
        <StatCard
          label="Unassigned"
          value={unassignedCount}
          icon={MapPinOff}
        />
        <StatCard
          label="Awaiting review"
          value={awaitingReview}
          icon={Inbox}
        />
      </div>

      <RecentReportsList reports={recentReports} isLoading={reportsLoading} />
    </div>
  );
}
