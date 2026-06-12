import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ListReportsResponse, ReportStatus } from "@/types/api";

const PAGE_SIZE = 20;

interface MyReportsFilters {
  status?: ReportStatus;
  q?: string;
  categoryId?: string;
}

/**
 * Fetches the citizen's owned reports one cursor page at a time. Filters are
 * sent to the API so the page never needs to drain the full report history.
 */
export function useMyReports(filters: MyReportsFilters = {}) {
  const query = useInfiniteQuery({
    queryKey: ["reports", "mine", filters],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({
        mine: "true",
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
