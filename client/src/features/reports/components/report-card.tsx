import { ThumbsUp, ImageIcon } from "lucide-react";
import { useNavigate } from "react-router";
import type { Report } from "@/types/api";
import { getRelativeTime } from "@/lib/utils";
import { getStatusStyle } from "@/features/reports/lib/status-styles";
import { ReportFlagBadges } from "@/features/reports/components/report-flag-badges";

interface ReportCardProps {
  report: Report;
  isSelected?: boolean;
  onClick?: (report: Report) => void;
}

export function ReportCard({ report, isSelected, onClick }: ReportCardProps) {
  const navigate = useNavigate();
  const style = getStatusStyle(report.status);
  const photo = report.photos?.[0]?.url;

  return (
    <div
      className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-all hover:shadow-md ${
        isSelected
          ? "border-primary bg-card shadow-md ring-1 ring-primary"
          : "border-border bg-card hover:border-primary/40"
      }`}
      onClick={() => onClick?.(report)}
    >
      <div className="w-20 shrink-0 self-stretch">
        {photo ? (
          <img
            src={photo}
            alt=""
            className="h-full w-full rounded-lg border border-border object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
            <ImageIcon className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {report.categoryName}
          </span>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            <ReportFlagBadges
              isHidden={report.isHidden}
              isLocked={report.isLocked}
              iconOnly
            />
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${style.bg} ${style.text}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {style.label}
            </span>
          </div>
        </div>

        <h3 className="truncate text-sm font-semibold text-card-foreground">
          {report.title}
        </h3>

        <p className="truncate text-xs text-muted-foreground">
          {getRelativeTime(report.createdAt)}
          {report.address && ` · ${report.address}`}
        </p>

        <div className="flex items-center justify-between text-xs">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/reports/${report.id}`);
            }}
            className="font-medium text-primary hover:underline"
          >
            View Details
          </button>
          <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
            <ThumbsUp className="h-3.5 w-3.5" />
            <span className="font-medium">{report.voteCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
