import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
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
        </div>
      </CardContent>
    </Card>
  );
}
