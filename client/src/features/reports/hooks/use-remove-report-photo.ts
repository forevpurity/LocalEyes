import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useRemoveReportPhoto(reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      await api(`/reports/${reportId}/photos/${photoId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
