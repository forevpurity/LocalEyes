import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BanResponse } from "@/types/api";

export function useBanStaff(staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api<BanResponse>(`/admin/staff/${staffId}/ban`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}
