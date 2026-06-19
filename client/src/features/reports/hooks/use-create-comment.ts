import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Comment, ReportDetail } from "@/types/api";

export function useCreateComment(id: string) {
  const queryClient = useQueryClient();
  const key = ["reports", id];

  return useMutation({
    mutationFn: (body: string) =>
      api<Comment>(`/reports/${id}/comments`, {
        method: "POST",
        json: { body },
      }),
    onSuccess: (comment) => {
      queryClient.setQueryData<ReportDetail>(key, (old) =>
        old ? { ...old, comments: [...old.comments, comment] } : old,
      );
    },
  });
}
