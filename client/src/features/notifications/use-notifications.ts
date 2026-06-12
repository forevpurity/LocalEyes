import { useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { useAuth } from "@/features/auth/auth-context";
import type {
  Notification,
  ListNotificationsResponse,
  UnreadCountResponse,
  MarkAllReadResponse,
} from "@/types/api";

const LIST_KEY = ["notifications", "list"] as const;
const UNREAD_COUNT_KEY = ["notifications", "unread-count"] as const;

export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: () => api<UnreadCountResponse>("/notifications/unread-count"),
    enabled: !!user && user.role === "citizen",
    select: (data) => data.count,
  });
}

export function useNotificationList(enabled: boolean) {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: () => api<ListNotificationsResponse>("/notifications"),
    enabled,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<Notification>(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api<MarkAllReadResponse>("/notifications/read", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}

/**
 * Connects the Socket.io client for authenticated citizens and surfaces incoming
 * `notification` events: toast + cache update. Disconnects when the user logs out.
 */
export function useNotificationSocket() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isCitizen = !!user && user.role === "citizen";

  useEffect(() => {
    // Tear the socket down on logout (or for non-citizens), not on every page
    // navigation — Navbar (and thus this hook) remounts on each route change.
    if (!isCitizen) {
      disconnectSocket();
      return;
    }

    const socket = getSocket();

    function handleNotification(notification: Notification) {
      toast(notification.title, { description: notification.body ?? undefined });

      queryClient.setQueryData<UnreadCountResponse>(UNREAD_COUNT_KEY, (prev) =>
        prev ? { count: prev.count + 1 } : prev,
      );
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      // Mark the related report's detail (incl. comments) stale so it refetches
      // when opened — matches the key used by useReport.
      queryClient.invalidateQueries({
        queryKey: ["reports", notification.reportId],
      });
    }

    socket.on("notification", handleNotification);

    // Only detach the listener on unmount/remount; keep the shared socket alive
    // so it's reused across navigations. Full disconnect happens above on logout.
    return () => {
      socket.off("notification", handleNotification);
    };
    // Reconnect when the logged-in user changes (e.g. logout/login).
  }, [isCitizen, user?.id, queryClient]);
}
