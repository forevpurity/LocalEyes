import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Category } from "@/types/api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });
}
