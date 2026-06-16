import type { ReportStatus } from "@/types/api";
import { STATUS_STYLES } from "@/features/reports/lib/status-styles";

/**
 * Statuses a guest or Citizen can see on the public map. The list endpoint
 * excludes terminal statuses (closed, rejected, withdrawn) from bbox queries,
 * so only these are meaningful to filter on. See server list-reports.ts.
 */
const PUBLIC_MAP_STATUSES: ReportStatus[] = [
  "submitted",
  "acknowledged",
  "in_progress",
  "resolved",
];

interface StatusFilterProps {
  selected: ReportStatus | null;
  onSelect: (status: ReportStatus | null) => void;
}

export function StatusFilter({ selected, onSelect }: StatusFilterProps) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {PUBLIC_MAP_STATUSES.map((status) => {
        const isActive = selected === status;
        const style = STATUS_STYLES[status];
        return (
          <button
            key={status}
            onClick={() => onSelect(isActive ? null : status)}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "border-primary bg-primary/10 font-semibold text-primary shadow-sm"
                : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${style.bg} ring-1 ring-inset ring-current ${style.text}`}
            />
            {style.label}
          </button>
        );
      })}
    </div>
  );
}
