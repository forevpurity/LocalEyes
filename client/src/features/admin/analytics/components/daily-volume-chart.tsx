import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import type { DailyVolumePoint } from "@/types/api";

const config = {
  count: { label: "Reports", color: "var(--chart-1)" },
} satisfies ChartConfig;

interface DailyVolumeChartProps {
  data: DailyVolumePoint[];
}

/** Format an ISO date string (YYYY-MM-DD) as "MMM D" for chart labels. */
function formatLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DailyVolumeChart({ data }: DailyVolumeChartProps) {
  const reducedMotion = usePrefersReducedMotion();

  const chartData = data.map((d) => ({
    label: formatLabel(d.date),
    count: d.count,
  }));

  // Show ~weekly ticks: every 4th day gives ~7 labels for 30 days
  const tickInterval = Math.max(1, Math.floor(chartData.length / 7));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report volume</CardTitle>
        <CardDescription>Reports submitted over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-body-sm text-muted-foreground">
            No data yet.
          </p>
        ) : (
          <ChartContainer config={config} className="h-64 w-full">
            <BarChart accessibilityLayer data={chartData} margin={{ left: 8, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={tickInterval}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--chart-1)"
                radius={4}
                maxBarSize={48}
                isAnimationActive={!reducedMotion}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
