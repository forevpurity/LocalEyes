import type { ReactNode } from "react";
import { Link } from "react-router";
import { Eye, EyeOff, EyeClosed, Lock, LockOpen } from "lucide-react";
import { toast } from "sonner";
import { cn, getRelativeTime } from "@/lib/utils";
import { getStatusStyle } from "@/features/reports/lib/status-styles";
import { canModerate } from "@/features/reports/lib/permissions";
import { useAuth } from "@/features/auth/use-auth";
import type { Report } from "@/types/api";
import { useSetReportHide } from "../hooks/use-set-report-hide";
import { useSetReportLock } from "../hooks/use-set-report-lock";

interface ReportRowProps {
  report: Report;
  /** Role-specific actions rendered before the hide/lock buttons (e.g. admin Assign). */
  extraActions?: ReactNode;
}

export function ReportRow({ report, extraActions }: ReportRowProps) {
  const { user } = useAuth();
  const status = getStatusStyle(report.status);
  const setHide = useSetReportHide(report.id);
  const setLock = useSetReportLock(report.id);
  const canMod = canModerate(report, user);

  const handleHide = () => {
    setHide.mutate(!report.isHidden, {
      onSuccess: () =>
        toast.success(report.isHidden ? "Report unhidden" : "Report hidden"),
      onError: () => toast.error("Couldn't change visibility."),
    });
  };

  const handleLock = () => {
    setLock.mutate(!report.isLocked, {
      onSuccess: () =>
        toast.success(report.isLocked ? "Report unlocked" : "Report locked"),
      onError: () => toast.error("Couldn't change lock state."),
    });
  };

  return (
    <tr className="border-b border-border transition-colors last:border-none hover:bg-muted/50">
      {/* Report */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Link
            to={`/reports/${report.id}`}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            {report.title}
          </Link>
          {report.isHidden && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
              <EyeClosed className="h-3 w-3" /> Hidden
            </span>
          )}
          {report.isLocked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
              <Lock className="h-3 w-3" /> Locked
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{report.categoryName}</span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase",
            status.bg,
            status.text,
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {status.label}
        </span>
      </td>

      {/* Department */}
      <td className="px-4 py-3 text-sm text-foreground">
        {report.departmentName ?? (
          <span className="text-muted-foreground">Unassigned</span>
        )}
      </td>

      {/* Citizen */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {report.citizenName ?? "Anonymous"}
      </td>

      {/* Created */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {getRelativeTime(report.createdAt)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {extraActions}
          {canMod && (
            <>
              <button
                onClick={handleHide}
                disabled={setHide.isPending}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                title={report.isHidden ? "Unhide report" : "Hide report"}
              >
                {report.isHidden ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={handleLock}
                disabled={setLock.isPending}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                title={report.isLocked ? "Unlock report" : "Lock report"}
              >
                {report.isLocked ? (
                  <LockOpen className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
