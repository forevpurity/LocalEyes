import { queryOptions, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/types/api";

const meQueryOptions = () =>
  queryOptions({
    queryKey: ["me"],
    queryFn: () => api<User>("/auth/me"),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });

export function useAuth() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(meQueryOptions());

  const logoutMutation = useMutation({
    mutationFn: () => api("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });

  return {
    user: data ?? null,
    isLoading,
    logout: logoutMutation.mutate,
  };
}
