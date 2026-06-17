import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Report } from "@/types/api";

/**
 * Hide or unhide a report via the explicit `/hide` and `/unhide` endpoints.
 * Pass the desired state, not a toggle, so repeated calls are idempotent.
 */
export function useSetReportHide(reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hidden: boolean) =>
      api<Report>(`/reports/${reportId}/${hidden ? "hide" : "unhide"}`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
