import { useState } from "react";
import type { FormEvent } from "react";
import { useUpdateReport } from "@/features/reports/hooks/use-update-report";
import { ApiRequestError } from "@/lib/api";
import type { ReportDetail } from "@/types/api";

export function ReportEditForm({
  report,
  onDone,
}: {
  report: ReportDetail;
  onDone: () => void;
}) {
  const updateReport = useUpdateReport(report.id);
  const [title, setTitle] = useState(report.title);
  const [description, setDescription] = useState(report.description);
  const [error, setError] = useState<string | null>(null);

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const canSave =
    !!trimmedTitle &&
    !!trimmedDescription &&
    !updateReport.isPending &&
    (trimmedTitle !== report.title ||
      trimmedDescription !== report.description);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setError(null);
    updateReport.mutate(
      { title: trimmedTitle, description: trimmedDescription },
      {
        onSuccess: onDone,
        onError: (err) =>
          setError(
            err instanceof ApiRequestError
              ? err.message
              : "Failed to update report.",
          ),
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6"
    >
      <h2 className="text-base font-semibold text-card-foreground">
        Edit report
      </h2>

      <label className="mt-4 block text-sm font-medium text-card-foreground">
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>

      <label className="mt-4 block text-sm font-medium text-card-foreground">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={5}
          className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          disabled={updateReport.isPending}
          className="h-9 rounded-lg px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {updateReport.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
