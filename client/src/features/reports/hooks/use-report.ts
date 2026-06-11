import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ReportDetail } from "@/types/api";

export function useReport(id: string | undefined) {
  return useQuery({
    queryKey: ["reports", id],
    queryFn: () => api<ReportDetail>(`/reports/${id}`),
    enabled: !!id,
  });
}
