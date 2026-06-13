import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ListReportsResponse, ReportStatus } from "@/types/api";

const PAGE_SIZE = 20;

export interface AdminReportsFilters {
  status?: ReportStatus;
  departmentId?: string;
  unassigned?: boolean;
  q?: string;
}

/**
 * Fetches all reports for the admin console one cursor page at a time. Unlike
 * the citizen `useMyReports` hook this is not scoped to `mine`/`subscribed` —
 * admins see every report — but it accepts the admin-only `departmentId` and
 * `unassigned` filters that the list endpoint exposes.
 */
export function useAdminReports(filters: AdminReportsFilters = {}) {
  const query = useInfiniteQuery({
    queryKey: ["reports", "admin", filters],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: PAGE_SIZE.toString() });
      if (filters.status) params.set("status", filters.status);
      if (filters.departmentId) params.set("departmentId", filters.departmentId);
      if (filters.unassigned) params.set("unassigned", "true");
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
