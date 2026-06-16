import { Clock, ArrowUp } from "lucide-react";

export type ReportSort = "recent" | "votes";

const OPTIONS: { value: ReportSort; label: string; icon: typeof Clock }[] = [
  { value: "recent", label: "Recent", icon: Clock },
  { value: "votes", label: "Most voted", icon: ArrowUp },
];

interface SortControlProps {
  value: ReportSort;
  onChange: (value: ReportSort) => void;
}

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <div
      role="group"
      aria-label="Sort reports"
      className="inline-flex rounded-lg border border-border bg-background p-0.5"
    >
      {OPTIONS.map((option) => {
        const isActive = value === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-primary/10 font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
