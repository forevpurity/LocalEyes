import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AnalyticsGranularity, AnalyticsSummary } from "@/types/api";

export function useAnalyticsSummary(granularity: AnalyticsGranularity = "day") {
  return useQuery({
    queryKey: ["analytics", "summary", granularity],
    queryFn: () =>
      api<AnalyticsSummary>(`/admin/analytics/summary?granularity=${granularity}`),
  });
}
