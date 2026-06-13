import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Report } from "@/types/api";

export function useToggleReportHide(reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api<Report>(`/reports/${reportId}/hide`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
