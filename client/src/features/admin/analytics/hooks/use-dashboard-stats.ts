import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AdminDashboardStats } from "@/types/api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: () => api<AdminDashboardStats>("/admin/analytics/dashboard"),
  });
}
