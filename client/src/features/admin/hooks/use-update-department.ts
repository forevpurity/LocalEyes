import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Department } from "@/types/api";

export interface UpdateDepartmentInput {
  name?: string;
  polygon?: { coordinates: [number, number][][] };
  categories?: string[];
  isActive?: boolean;
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateDepartmentInput & { id: string }) =>
      api<Department>(`/departments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["departments", variables.id] });
    },
  });
}
