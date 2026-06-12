import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Comment, ReportDetail } from "@/types/api";

export function useEditComment(reportId: string, commentId: string) {
  const queryClient = useQueryClient();
  const key = ["reports", reportId];

  return useMutation({
    mutationFn: (body: string) =>
      api<Comment>(`/reports/${reportId}/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ body }),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData<ReportDetail>(key, (old) =>
        old
          ? {
              ...old,
              comments: old.comments.map((c) =>
                c.id === updated.id ? updated : c,
              ),
            }
          : old,
      );
    },
  });
}
