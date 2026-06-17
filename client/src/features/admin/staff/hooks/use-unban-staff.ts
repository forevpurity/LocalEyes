import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BanResponse } from "@/types/api";

export function useUnbanStaff(staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api<BanResponse>(`/admin/staff/${staffId}/unban`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}
