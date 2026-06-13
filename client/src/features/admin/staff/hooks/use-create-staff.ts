import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { StaffListItem } from "@/types/api";

export interface CreateStaffInput {
  email: string;
  password: string;
  displayName: string;
  departmentId: string;
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStaffInput) =>
      api<StaffListItem>("/admin/staff", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}
