import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Report } from "@/types/api";

interface UpdateReportBody {
  title: string;
  description: string;
}

export function useUpdateReport(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateReportBody) =>
      api<Report>(`/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", id] });
      queryClient.invalidateQueries({ queryKey: ["reports", "mine"] });
    },
  });
}
