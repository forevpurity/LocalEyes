import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CoveringResponse } from "@/types/api";

export function useCoveringDepartment(lat: number | undefined, lng: number | undefined) {
  return useQuery({
    queryKey: ["departments", "covering", lat, lng],
    queryFn: () =>
      api<CoveringResponse>(`/departments/covering?lat=${lat}&lng=${lng}`),
    enabled: lat !== undefined && lng !== undefined,
    staleTime: 0,
  });
}
