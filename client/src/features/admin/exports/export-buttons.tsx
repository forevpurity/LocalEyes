import { Download, Loader2 } from "lucide-react";
import { useExport } from "./hooks/use-export";

export function ExportButtons() {
  const { download, pending } = useExport();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => download("csv")}
        disabled={pending !== null}
        aria-busy={pending === "csv"}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
      >
        {pending === "csv" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
        CSV
      </button>
      <button
        onClick={() => download("geojson")}
        disabled={pending !== null}
        aria-busy={pending === "geojson"}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
      >
        {pending === "geojson" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
        GeoJSON
      </button>
    </div>
  );
}
