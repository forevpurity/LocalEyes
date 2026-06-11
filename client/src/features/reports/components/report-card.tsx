import { ThumbsUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import type { Report } from "@/types/api";
import { getRelativeTime } from "@/lib/utils";
import { getCategoryIcon } from "@/features/reports/lib/category-icons";

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  submitted: { bg: "bg-primary/10", text: "text-primary", label: "Submitted" },
  in_progress: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    label: "In Progress",
  },
  resolved: { bg: "bg-green-50", text: "text-green-800", label: "Resolved" },
  acknowledged: {
    bg: "bg-violet-50",
    text: "text-violet-800",
    label: "Acknowledged",
  },
  closed: { bg: "bg-gray-100", text: "text-gray-600", label: "Closed" },
  rejected: { bg: "bg-red-50", text: "text-red-800", label: "Rejected" },
  withdrawn: { bg: "bg-red-50", text: "text-red-800", label: "Withdrawn" },
};

interface ReportCardProps {
  report: Report;
  isSelected?: boolean;
  onClick?: (report: Report) => void;
}

export function ReportCard({ report, isSelected, onClick }: ReportCardProps) {
  const navigate = useNavigate();
  const style = STATUS_STYLES[report.status] ?? STATUS_STYLES.submitted;
  const photo = report.photos?.[0]?.url;

  return (
    <div
      className={`flex gap-3 cursor-pointer rounded-xl border p-3 transition-all hover:shadow-md ${
        isSelected
          ? "border-primary shadow-md ring-1 ring-primary"
          : "border-border bg-card"
      }`}
      onClick={() => onClick?.(report)}
    >
      {photo && (
        <div className="shrink-0">
          <img
            src={photo}
            alt=""
            className="h-17 w-20 rounded-lg border border-border object-cover"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-start justify-between gap-2">
          <span
            className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${style.bg} ${style.text}`}
          >
            {style.label}
          </span>
          <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
            <ThumbsUp className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{report.voteCount}</span>
          </div>
        </div>

        <div className="mb-1 flex items-center gap-1.5">
          <span className="text-base" aria-hidden="true">
            {getCategoryIcon({
              id: report.categoryId,
              name: report.categoryName,
            })}
          </span>
          <h3 className="truncate text-sm font-semibold text-primary">
            {report.title}
          </h3>
        </div>

        {report.address && (
          <p className="mb-2 truncate text-xs text-muted-foreground">
            📍 {report.address}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground/70">
          <span>{getRelativeTime(report.createdAt)}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/reports/${report.id}`);
            }}
            className="flex items-center gap-0.5 font-medium text-primary hover:underline"
          >
            View details <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
