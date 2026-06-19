import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Category } from "@/types/api";

export interface UpdateCategoryInput {
  name: string;
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateCategoryInput & { id: string }) =>
      api<Category>(`/categories/${id}`, {
        method: "PATCH",
        json: data,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", variables.id] });
      // Category.name is embedded in Department.categories[]
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}
