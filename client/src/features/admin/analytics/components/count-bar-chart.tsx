import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
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

export interface CountDatum {
  label: string;
  count: number;
  /** Optional explicit bar color (e.g. semantic status color). */
  color?: string;
}

const config = {
  count: { label: "Reports", color: "var(--chart-1)" },
} satisfies ChartConfig;

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface CountBarChartProps {
  title: string;
  description?: string;
  data: CountDatum[];
}

export function CountBarChart({ title, description, data }: CountBarChartProps) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-body-sm text-muted-foreground">
            No data yet.
          </p>
        ) : (
          <ChartContainer config={config} className="h-64 w-full">
            <BarChart accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                angle={data.length > 5 ? -30 : 0}
                textAnchor={data.length > 5 ? "end" : "middle"}
                height={data.length > 5 ? 60 : 30}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                radius={6}
                maxBarSize={64}
                isAnimationActive={!reducedMotion}
              >
                {data.map((d, i) => (
                  <Cell
                    key={d.label}
                    fill={d.color ?? PALETTE[i % PALETTE.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
