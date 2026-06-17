import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Report } from "@/types/api";

/**
 * Lock or unlock a report via the explicit `/lock` and `/unlock` endpoints.
 * Pass the desired state, not a toggle, so repeated calls are idempotent.
 */
export function useSetReportLock(reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locked: boolean) =>
      api<Report>(`/reports/${reportId}/${locked ? "lock" : "unlock"}`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
