import { Loader2, FileText, Users, CheckCircle2, Clock } from "lucide-react";
import { useDashboardStats } from "./analytics/hooks/use-dashboard-stats";
import { StatCard } from "./analytics/components/stat-card";
import { DailyVolumeChart } from "./analytics/components/daily-volume-chart";
import { DepartmentPerformanceTable } from "./dashboard/department-performance-table";
import { formatResolution } from "./analytics/lib/format-resolution";

export function AdminDashboard() {
  const { data, isLoading, error } = useDashboardStats();

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-headline-sm font-semibold">Dashboard</h1>
        <p className="text-body-sm text-muted-foreground">
          Overview of system activity
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Reports (last 30 days)"
          value={data.totalReports.value}
          icon={FileText}
          trend={{ percent: data.totalReports.trendPercent }}
        />
        <StatCard
          label="Active users"
          value={data.activeUsers.value}
          icon={Users}
          trend={{ percent: data.activeUsers.trendPercent }}
        />
        <StatCard
          label="Resolution rate"
          value={`${data.resolutionRate.value}%`}
          icon={CheckCircle2}
          trend={{ percent: data.resolutionRate.trendPercent }}
        />
        <StatCard
          label="Avg. resolution"
          value={formatResolution(data.avgResolutionHours.value)}
          icon={Clock}
          trend={{
            percent: data.avgResolutionHours.trendPercent,
            invert: true,
          }}
        />
      </div>

      <div className="mb-6">
        <DailyVolumeChart data={data.dailyVolume} />
      </div>

      <DepartmentPerformanceTable departments={data.departments} />
    </div>
  );
}
