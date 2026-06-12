import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ReportDetail } from "@/types/api";

interface VoteResponse {
  voted: boolean;
  voteCount: number;
}

export function useToggleVote(id: string) {
  const queryClient = useQueryClient();
  const key = ["reports", id];

  return useMutation({
    mutationFn: () =>
      api<VoteResponse>(`/reports/${id}/vote`, { method: "PATCH" }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<ReportDetail>(key);
      if (prev) {
        queryClient.setQueryData<ReportDetail>(key, {
          ...prev,
          hasVoted: !prev.hasVoted,
          voteCount: prev.voteCount + (prev.hasVoted ? -1 : 1),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSuccess: (data) => {
      queryClient.setQueryData<ReportDetail>(key, (old) =>
        old ? { ...old, hasVoted: data.voted, voteCount: data.voteCount } : old,
      );
    },
  });
}
