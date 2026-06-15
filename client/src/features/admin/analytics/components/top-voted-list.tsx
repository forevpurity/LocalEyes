import { Link } from "react-router";
import { ThumbsUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getStatusStyle } from "@/features/reports/lib/status-styles";
import type { TopVotedReport } from "@/types/api";

interface TopVotedListProps {
  reports: TopVotedReport[];
}

export function TopVotedList({ reports }: TopVotedListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top voted reports</CardTitle>
        <CardDescription>Most upvoted reports across the city</CardDescription>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <p className="py-8 text-center text-body-sm text-muted-foreground">
            No votes yet.
          </p>
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
                    <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-foreground">
                      <ThumbsUp className="h-4 w-4 text-primary" aria-hidden="true" />
                      {report.voteCount}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {report.title}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-label-sm font-medium ${style.bg} ${style.text}`}
                    >
                      {style.label}
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
