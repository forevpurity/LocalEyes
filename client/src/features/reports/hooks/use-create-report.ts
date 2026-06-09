import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUpload } from "@/lib/api";
import type { Report } from "@/types/api";

export interface CreateReportInput {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string | null;
  categoryId: string;
  photos: File[];
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReportInput) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("latitude", String(data.latitude));
      formData.append("longitude", String(data.longitude));
      if (data.address !== null) {
        formData.append("address", data.address);
      }
      formData.append("categoryId", data.categoryId);
      data.photos.forEach((photo) => {
        formData.append("photos", photo);
      });

      return apiUpload<Report>("/reports", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
