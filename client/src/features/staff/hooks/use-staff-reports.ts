import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ListReportsResponse, ReportStatus } from "@/types/api";

const PAGE_SIZE = 20;

export interface StaffReportsFilters {
  status?: ReportStatus;
  q?: string;
}

/**
 * Fetches the current staff member's department reports, one cursor page at
 * a time. The server automatically scopes results to the staff member's own
 * department — no `departmentId` param is needed here.
 */
export function useStaffReports(filters: StaffReportsFilters = {}) {
  const query = useInfiniteQuery({
    queryKey: ["reports", "staff", filters],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: PAGE_SIZE.toString() });
      if (filters.status) params.set("status", filters.status);
      if (filters.q) params.set("q", filters.q);
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
