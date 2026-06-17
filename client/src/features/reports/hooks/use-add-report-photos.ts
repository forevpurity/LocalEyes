import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUpload } from "@/lib/api";

interface AddPhotosResponse {
  photos: { url: string; order: number; kind: "before" | "after" }[];
}

export function useAddReportPhotos(reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("photos", file);
      });

      return apiUpload<AddPhotosResponse>(
        `/reports/${reportId}/photos`,
        formData,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
