import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Bell } from "lucide-react";
import { getRelativeTime, cn } from "@/lib/utils";
import {
  useUnreadCount,
  useNotificationList,
  useMarkRead,
  useMarkAllRead,
  useNotificationSocket,
} from "./use-notifications";
import type { Notification } from "@/types/api";

export function NotificationBell({ align = "right" }: { align?: "left" | "right" } = {}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useNotificationSocket();

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: list, isLoading } = useNotificationList(open);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  function handleSelect(notification: Notification) {
    if (!notification.readAt) markRead.mutate(notification.id);
    setOpen(false);
    navigate(`/reports/${notification.reportId}`);
  }

  const items = list?.items ?? [];

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-on-surface-variant hover:text-primary transition-colors"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={cn(
          "absolute mt-1 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-outline-variant bg-surface-container-lowest shadow-md pt-1 z-50",
          align === "left" ? "left-0" : "right-0",
        )}>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-medium text-on-surface">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="my-0 h-px bg-outline-variant" />

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="px-3 py-6 text-center text-sm text-on-surface-variant">
                Loading…
              </p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-on-surface-variant">
                No notifications yet
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleSelect(n)}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors hover:bg-muted",
                    !n.readAt && "bg-primary/5",
                  )}
                >
                  <div className="flex w-full items-start gap-2">
                    {!n.readAt && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                    <span
                      className={cn(
                        "flex-1 text-sm text-on-surface",
                        !n.readAt && "font-medium",
                      )}
                    >
                      {n.title}
                    </span>
                  </div>
                  {n.body && (
                    <span className="text-xs text-on-surface-variant line-clamp-2">
                      {n.body}
                    </span>
                  )}
                  <span className="text-[11px] text-on-surface-variant">
                    {getRelativeTime(n.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
