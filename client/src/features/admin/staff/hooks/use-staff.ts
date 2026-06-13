import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ListStaffResponse } from "@/types/api";

const PAGE_SIZE = 20;

export interface StaffFilters {
  departmentId?: string;
  status?: "active" | "banned";
  name?: string;
}

export function useStaff(filters: StaffFilters = {}) {
  const query = useInfiniteQuery({
    queryKey: ["staff", filters],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: PAGE_SIZE.toString() });
      if (filters.departmentId) params.set("departmentId", filters.departmentId);
      if (filters.status) params.set("status", filters.status);
      if (filters.name) params.set("name", filters.name);
      if (pageParam) params.set("cursor", pageParam);

      return api<ListStaffResponse>(`/admin/staff?${params}`);
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
