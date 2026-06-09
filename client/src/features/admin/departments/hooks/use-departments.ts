import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Department } from "@/types/api";

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => api<Department[]>("/departments"),
  });
}
