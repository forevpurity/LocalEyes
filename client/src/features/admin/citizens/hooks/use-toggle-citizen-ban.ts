import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ToggleBanResponse } from "@/types/api";

export function useToggleCitizenBan(citizenId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api<ToggleBanResponse>(`/admin/citizens/${citizenId}/ban`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizens"] });
    },
  });
}
