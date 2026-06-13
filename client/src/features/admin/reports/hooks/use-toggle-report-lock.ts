import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Report } from "@/types/api";

export function useToggleReportLock(reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api<Report>(`/reports/${reportId}/lock`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
