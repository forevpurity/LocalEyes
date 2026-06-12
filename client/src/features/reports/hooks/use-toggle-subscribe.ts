import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ReportDetail } from "@/types/api";

interface SubscribeResponse {
  subscribed: boolean;
}

export function useToggleSubscribe(id: string) {
  const queryClient = useQueryClient();
  const key = ["reports", id];

  return useMutation({
    mutationFn: () =>
      api<SubscribeResponse>(`/reports/${id}/subscribe`, { method: "PATCH" }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<ReportDetail>(key);
      if (prev) {
        queryClient.setQueryData<ReportDetail>(key, {
          ...prev,
          isSubscribed: !prev.isSubscribed,
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSuccess: (data) => {
      queryClient.setQueryData<ReportDetail>(key, (old) =>
        old ? { ...old, isSubscribed: data.subscribed } : old,
      );
    },
  });
}
