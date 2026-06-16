import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AnalyticsGranularity, DepartmentSummary } from "@/types/api";

export function useDepartmentSummary(
  granularity: AnalyticsGranularity = "day",
) {
  return useQuery({
    queryKey: ["analytics", "department", granularity],
    queryFn: () =>
      api<DepartmentSummary>(
        `/admin/analytics/department?granularity=${granularity}`,
      ),
  });
}
