import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BanResponse } from "@/types/api";

export function useBanCitizen(citizenId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api<BanResponse>(`/admin/citizens/${citizenId}/ban`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizens"] });
    },
  });
}
