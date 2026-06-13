import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ToggleBanResponse } from "@/types/api";

export function useToggleStaffBan(staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api<ToggleBanResponse>(`/admin/staff/${staffId}/ban`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}
