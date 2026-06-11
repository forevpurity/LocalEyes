import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ListReportsResponse, Report } from "@/types/api";

export interface BBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface ViewportChange extends BBox {
  center: [number, number];
  zoom: number;
}

export function useMapReports(bbox: BBox | null) {
  return useQuery({
    queryKey: ["reports", "map", bbox],
    queryFn: async () => {
      if (!bbox) return { items: [] as Report[], hasMore: false };
      const params = new URLSearchParams({
        minLat: bbox.minLat.toString(),
        maxLat: bbox.maxLat.toString(),
        minLng: bbox.minLng.toString(),
        maxLng: bbox.maxLng.toString(),
      });
      const data = await api<ListReportsResponse>(`/reports?${params}`);
      return data;
    },
    placeholderData: (prev) => prev,
    enabled: bbox !== null,
  });
}
