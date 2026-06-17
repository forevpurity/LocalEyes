import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import type { Report } from "@/types/api";
import type { BBox } from "./use-map-reports";

/**
 * Check if a report's location falls within the given bounding box.
 */
function isReportInBBox(report: Report, bbox: BBox | null): boolean {
  if (!bbox) return false;
  return (
    report.latitude >= bbox.minLat &&
    report.latitude <= bbox.maxLat &&
    report.longitude >= bbox.minLng &&
    report.longitude <= bbox.maxLng
  );
}

/**
 * Hook to enable real-time map updates via Socket.io.
 *
 * - Joins the "map-viewers" room when mounted
 * - Listens for "report:created" events
 * - Adds new reports to the cache if they fall within the current viewport
 * - Leaves the room on unmount
 *
 * The map is a public view (guests + citizens) showing all reports, so no
 * role/department scoping is applied here — staff/admin don't access this page.
 *
 * Note: The socket connection is reused across the app (singleton), so we only
 * manage room membership here, not connection lifecycle.
 */
export function useMapRealtime(bbox: BBox | null): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    // Join the map-viewers room to receive real-time updates
    socket.emit("map:join");

    function handleReportCreated(report: Report) {
      // Only add the report if it's within the current viewport
      if (!isReportInBBox(report, bbox)) {
        return;
      }

      // Optimistically add the new report to the cache for the current bbox query
      queryClient.setQueryData<{ items: Report[]; hasMore?: boolean }>(
        ["reports", "map", bbox],
        (prev) => {
          if (!prev) return prev;

          // Check if report already exists (avoid duplicates)
          if (prev.items.some((r) => r.id === report.id)) {
            return prev;
          }

          // Add new report to the beginning (newest first)
          return {
            ...prev,
            items: [report, ...prev.items],
          };
        },
      );
    }

    socket.on("report:created", handleReportCreated);

    return () => {
      socket.off("report:created", handleReportCreated);
      socket.emit("map:leave");
    };
  }, [bbox, queryClient]);
}
