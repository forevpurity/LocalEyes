import { Link } from "react-router";
import { Loader2, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRelativeTime } from "@/lib/utils";
import { getStatusStyle } from "@/features/reports/lib/status-styles";
import type { Report } from "@/types/api";

interface RecentReportsListProps {
  reports: Report[];
  isLoading?: boolean;
}

export function RecentReportsList({ reports, isLoading }: RecentReportsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent reports</CardTitle>
        <CardDescription>The latest reports submitted city-wide</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div role="status" className="flex justify-center py-8">
            <Loader2
              className="h-5 w-5 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
            <span className="sr-only">Loading reports…</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" aria-hidden="true" />
            <p className="text-body-sm">No reports yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {reports.map((report) => {
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
                        {report.departmentName ?? "Unassigned"}
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
      </CardContent>
    </Card>
  );
}
