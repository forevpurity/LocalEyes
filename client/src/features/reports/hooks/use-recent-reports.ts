import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { HCM_BOUNDS } from "@/lib/map-constants";
import type { ListReportsResponse } from "@/types/api";

export function useRecentReports(limit = 6) {
  return useQuery({
    queryKey: ["reports", "recent"],
    queryFn: async () => {
      const sw = HCM_BOUNDS.getSouthWest();
      const ne = HCM_BOUNDS.getNorthEast();
      const params = new URLSearchParams({
        minLat: sw.lat.toString(),
        maxLat: ne.lat.toString(),
        minLng: sw.lng.toString(),
        maxLng: ne.lng.toString(),
      });
      const data = await api<ListReportsResponse>(`/reports?${params}`);
      return data.items.slice(0, limit);
    },
  });
}
