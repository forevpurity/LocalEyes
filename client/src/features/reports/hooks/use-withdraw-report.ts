import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Report } from "@/types/api";

interface WithdrawPayload {
  body: string;
}

export function useWithdrawReport(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WithdrawPayload) =>
      api<Report>(`/reports/${id}/withdraw`, {
        method: "PATCH",
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
