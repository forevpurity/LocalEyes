import { useState } from "react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/api";

type ExportFormat = "csv" | "geojson";

const EXPORT_PATHS: Record<ExportFormat, { url: string; filename: string }> = {
  csv: { url: "/api/admin/exports/reports.csv", filename: "reports.csv" },
  geojson: {
    url: "/api/admin/exports/reports.geojson",
    filename: "reports.geojson",
  },
};

// Downloads an admin export via the authenticated fetch wrapper (handles the
// httpOnly cookie + 401→refresh), then triggers a browser download from the blob.
export function useExport() {
  const [pending, setPending] = useState<ExportFormat | null>(null);

  async function download(format: ExportFormat) {
    const { url, filename } = EXPORT_PATHS[format];
    setPending(format);
    try {
      const res = await fetchWithAuth(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("Couldn't download export.");
    } finally {
      setPending(null);
    }
  }

  return { download, pending };
}
