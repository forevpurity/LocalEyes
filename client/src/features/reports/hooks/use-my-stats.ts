import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { MyReportStats } from "@/types/api";

/**
 * Fetches aggregate stats for the current citizen's own reports:
 * total count, breakdown by status, and average resolution time.
 */
export function useMyStats({ enabled }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["reports", "my-stats"],
    queryFn: () => api<MyReportStats>("/reports/my-stats"),
    staleTime: 60_000,
    enabled,
  });
}
