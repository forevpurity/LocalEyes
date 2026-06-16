import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Report } from "@/types/api";

export function useWithdrawReport(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api<Report>(`/reports/${id}/withdraw`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", id] });
      queryClient.invalidateQueries({ queryKey: ["reports", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["reports", "my-stats"] });
    },
  });
}
