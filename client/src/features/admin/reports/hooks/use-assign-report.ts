import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Report } from "@/types/api";

export function useAssignReport(reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (departmentId: string) =>
      api<Report>(`/reports/${reportId}/assign`, {
        method: "PATCH",
        json: { departmentId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
