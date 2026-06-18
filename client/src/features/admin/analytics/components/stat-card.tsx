import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardTrend {
  percent: number | null;
  /** When true, a decrease is favorable (e.g. avg resolution time). */
  invert?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  trend?: StatCardTrend;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, hint, trend, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex items-start gap-4">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-label-sm text-muted-foreground">{label}</p>
          <p className="text-headline-sm font-semibold text-foreground">
            {value}
          </p>
          {hint && (
            <p className="text-label-sm text-muted-foreground">{hint}</p>
          )}
          {trend && (
            <TrendPill trend={trend} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TrendPill({ trend }: { trend: StatCardTrend }) {
  if (trend.percent == null) {
    return (
      <span className="text-label-sm text-muted-foreground">
        — vs last month
      </span>
    );
  }

  if (trend.percent === 0) {
    return (
      <span className="text-label-sm text-muted-foreground">
        0% vs last month
      </span>
    );
  }

  const isUp = trend.percent > 0;
  const favorable = trend.invert ? !isUp : isUp;
  const arrow = isUp ? "▲" : "▼";
  const colorClass = favorable ? "text-success" : "text-destructive";

  return (
    <span className={`text-label-sm font-medium ${colorClass}`}>
      {arrow} {Math.abs(trend.percent)}% vs last month
    </span>
  );
}
