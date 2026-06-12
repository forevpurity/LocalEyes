import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ListReportsResponse } from "@/types/api";

export function useMyReports() {
  return useQuery({
    queryKey: ["reports", "mine"],
    queryFn: () => api<ListReportsResponse>("/reports?mine=true"),
  });
}
