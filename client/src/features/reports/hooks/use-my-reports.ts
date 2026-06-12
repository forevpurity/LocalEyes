import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ListReportsResponse, ReportStatus } from "@/types/api";

const PAGE_SIZE = 20;

export type ReportsScope = "mine" | "subscribed";

interface MyReportsFilters {
  status?: ReportStatus;
  q?: string;
  categoryId?: string;
}

/**
 * Fetches a citizen's reports one cursor page at a time, scoped to either the
 * reports they own (`mine`) or the reports they follow (`subscribed`). Filters
 * are sent to the API so the page never needs to drain the full report history.
 */
export function useMyReports(
  scope: ReportsScope = "mine",
  filters: MyReportsFilters = {},
) {
  const query = useInfiniteQuery({
    queryKey: ["reports", scope, filters],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({
        [scope]: "true",
        limit: PAGE_SIZE.toString(),
      });
      if (filters.status) params.set("status", filters.status);
      if (filters.q) params.set("q", filters.q);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (pageParam) params.set("cursor", pageParam);

      return api<ListReportsResponse>(`/reports?${params}`);
    },
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  return {
    ...query,
    data: query.data
      ? { items: query.data.pages.flatMap((page) => page.items) }
      : undefined,
  };
}
