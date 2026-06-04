import { ThumbsUp } from "lucide-react";
import type { Report } from "@/types/api";
import { getRelativeTime } from "@/features/reports/data/mock-reports";

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
    bg: "bg-blue-50",
    text: "text-blue-800",
    label: "Acknowledged",
  },
  closed: { bg: "bg-gray-100", text: "text-gray-600", label: "Closed" },
  rejected: { bg: "bg-red-50", text: "text-red-800", label: "Rejected" },
};

interface ReportCardProps {
  report: Report;
  isSelected?: boolean;
  onClick?: (report: Report) => void;
}

export function ReportCard({ report, isSelected, onClick }: ReportCardProps) {
  const style = STATUS_STYLES[report.status] ?? STATUS_STYLES.submitted;

  return (
    <div
      className={`cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md ${
        isSelected
          ? "border-primary shadow-md ring-1 ring-primary"
          : "border-border bg-card"
      }`}
      onClick={() => onClick?.(report)}
    >
      <div className="mb-2 flex items-start justify-between">
        <span
          className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${style.bg} ${style.text}`}
        >
          {style.label}
        </span>
        <div className="flex items-center gap-1 text-muted-foreground">
          <ThumbsUp className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{report.voteCount}</span>
        </div>
      </div>

      <div className="mb-1 flex items-center gap-2">
        <span className="text-base" aria-hidden="true">
          {report.categoryIcon}
        </span>
        <h3 className="text-sm font-semibold text-primary line-clamp-1">
          {report.title}
        </h3>
      </div>

      {report.address && (
        <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          <span aria-hidden="true">📍</span>
          {report.address}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground/70">
        <span>{getRelativeTime(report.createdAt)}</span>
      </div>
    </div>
  );
}
