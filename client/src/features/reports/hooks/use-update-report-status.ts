import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Comment, ReportStatus } from "@/types/api";

export interface UpdateStatusInput {
  newStatus: ReportStatus;
  body: string;
}

/**
 * Moves a report to a new lifecycle status with a required status note. The
 * endpoint returns the created status-note comment; the report's status and
 * timeline change server-side, so we invalidate `["reports"]` to refetch.
 */
export function useUpdateReportStatus(reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateStatusInput) =>
      api<Comment>(`/reports/${reportId}/status`, {
        method: "POST",
        json: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
