import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Category } from "@/types/api";

export function useCategory(id: string) {
  return useQuery({
    queryKey: ["categories", id],
    queryFn: () => api<Category>(`/categories/${id}`),
  });
}
