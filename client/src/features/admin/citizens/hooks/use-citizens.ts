import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ListCitizensResponse } from "@/types/api";

const PAGE_SIZE = 20;

export interface CitizenFilters {
  status?: "active" | "banned";
  name?: string;
}

export function useCitizens(filters: CitizenFilters = {}) {
  const query = useInfiniteQuery({
    queryKey: ["citizens", filters],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: PAGE_SIZE.toString() });
      if (filters.status) params.set("status", filters.status);
      if (filters.name) params.set("name", filters.name);
      if (pageParam) params.set("cursor", pageParam);

      return api<ListCitizensResponse>(`/admin/citizens?${params}`);
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
