import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Department } from "@/types/api";

export function useGetDepartment(id: string) {
  return useQuery({
    queryKey: ["departments", id],
    queryFn: () => api<Department>(`/departments/${id}`),
  });
}
