import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useUpdateReport } from "@/features/reports/hooks/use-update-report";
import {
  reportContentSchema,
  type ReportContent,
} from "@/features/reports/lib/report-schema";
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
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = useForm<ReportContent>({
    resolver: zodResolver(reportContentSchema),
    mode: "onChange",
    defaultValues: {
      title: report.title,
      description: report.description,
    },
  });

  const onSubmit = (values: ReportContent) => {
    setError(null);
    updateReport.mutate(values, {
      onSuccess: () => {
        toast.success("Report updated.");
        onDone();
      },
      onError: (err) =>
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Failed to update report.",
        ),
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6"
    >
      <h2 className="text-base font-semibold text-card-foreground">
        Edit report
      </h2>

      <label className="mt-4 block text-sm font-medium text-card-foreground">
        Title
        <input
          {...register("title")}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>
      {errors.title && (
        <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
      )}

      <label className="mt-4 block text-sm font-medium text-card-foreground">
        Description
        <textarea
          {...register("description")}
          rows={5}
          className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>
      {errors.description && (
        <p className="mt-1 text-xs text-destructive">
          {errors.description.message}
        </p>
      )}

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onDone}
          disabled={updateReport.isPending}
          className="h-9 w-full rounded-lg px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50 sm:w-auto"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || !isDirty || updateReport.isPending}
          className="h-9 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
        >
          {updateReport.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
