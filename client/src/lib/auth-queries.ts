import { queryOptions } from "@tanstack/react-query";
import { api } from "./api";
import type { User } from "@/types/api";

export const meQueryOptions = () =>
  queryOptions({
    queryKey: ["me"],
    queryFn: () => api<User>("/auth/me"),
    staleTime: Infinity,
    retry: false,
  });
