import { useState } from "react";
import { Loader2, Clock } from "lucide-react";
import { useAnalyticsSummary } from "./analytics/hooks/use-analytics-summary";
import { StatCard } from "./analytics/components/stat-card";
import {
  CountBarChart,
  type CountDatum,
} from "./analytics/components/count-bar-chart";
import { TrendsLineChart } from "./analytics/components/trends-line-chart";
import { TopVotedList } from "./analytics/components/top-voted-list";
import { formatResolution } from "./analytics/lib/format-resolution";
import { ExportButtons } from "./exports/export-buttons";
import {
  getStatusStyle,
  getStatusColor,
} from "@/features/reports/lib/status-styles";
import type { AnalyticsGranularity } from "@/types/api";

export function AdminAnalyticsPage() {
  const [granularity, setGranularity] = useState<AnalyticsGranularity>("day");
  const { data, isLoading, error } = useAnalyticsSummary(granularity);

  const statusData: CountDatum[] =
    data?.statusCounts.map((s) => ({
      label: getStatusStyle(s.status).label,
      count: s.count,
      color: getStatusColor(s.status),
    })) ?? [];
  const categoryData: CountDatum[] =
    data?.categoryCounts.map((c) => ({
      label: c.categoryName,
      count: c.count,
    })) ?? [];
  const departmentData: CountDatum[] =
    data?.departmentCounts.map((d) => ({
      label: d.departmentName,
      count: d.count,
    })) ?? [];

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-sm font-semibold">Analytics</h1>
          <p className="text-body-sm text-muted-foreground">
            System-wide trends and metrics
          </p>
        </div>
        <ExportButtons />
      </div>

      {isLoading && (
        <div
          role="status"
          className="flex h-64 items-center justify-center"
        >
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
          <span className="sr-only">Loading analytics…</span>
        </div>
      )}

      {error && (
        <div className="flex h-64 items-center justify-center text-center text-sm text-destructive">
          Failed to load analytics.
          <button
            onClick={() => window.location.reload()}
            className="ml-1 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && data && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total reports"
              value={data.totalReports}
              hint="All time"
            />
            <StatCard
              label="Avg. time to resolve"
              value={formatResolution(data.averageResolution.averageHours)}
              icon={Clock}
              hint="All time"
            />
            <StatCard
              label="Resolved reports"
              value={data.averageResolution.resolvedCount}
              hint="All time"
            />
          </div>

          <TrendsLineChart
            data={data.reportsOverTime}
            granularity={granularity}
            onGranularityChange={setGranularity}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <CountBarChart
              title="Reports by status"
              description="All time"
              data={statusData}
            />
            <CountBarChart
              title="Reports by category"
              description="All time"
              data={categoryData}
            />
            <CountBarChart
              title="Reports by department"
              description="All time"
              data={departmentData}
            />
            <TopVotedList reports={data.topVotedReports} />
          </div>
        </div>
      )}
    </div>
  );
}
