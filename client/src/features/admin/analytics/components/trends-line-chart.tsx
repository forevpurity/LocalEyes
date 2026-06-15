import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import type { AnalyticsGranularity, TrendPoint } from "@/types/api";

const config = {
  count: { label: "Reports", color: "var(--chart-1)" },
} satisfies ChartConfig;

function formatPeriod(iso: string, granularity: AnalyticsGranularity): string {
  const date = new Date(iso);
  if (granularity === "month") {
    return date.toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface TrendsLineChartProps {
  data: TrendPoint[];
  granularity: AnalyticsGranularity;
}

export function TrendsLineChart({ data, granularity }: TrendsLineChartProps) {
  const reducedMotion = usePrefersReducedMotion();
  const chartData = data.map((d) => ({
    period: formatPeriod(d.period, granularity),
    count: d.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports over time</CardTitle>
        <CardDescription>
          New reports per {granularity}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-body-sm text-muted-foreground">
            No data yet.
          </p>
        ) : (
          <ChartContainer config={config} className="h-64 w-full">
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 8, right: 8, top: 8 }}
            >
              <defs>
                <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-count)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-count)"
                    stopOpacity={0.03}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="period"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="count"
                type="monotone"
                fill="url(#trend-fill)"
                stroke="var(--color-count)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-count)" }}
                activeDot={{ r: 5 }}
                isAnimationActive={!reducedMotion}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
