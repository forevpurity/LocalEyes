import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { ApiRequestError } from "@/lib/api";
import { STATUS_STYLES } from "@/features/reports/lib/status-styles";
import { useUpdateReportStatus } from "@/features/reports/hooks/use-update-report-status";
import type { ReportDetail, ReportStatus } from "@/types/api";

interface StatusChangeModalProps {
  report: ReportDetail;
  onClose: () => void;
}

// Terminal states feel irreversible to staff, so their confirmation gets
// sharper, higher-regret copy than a routine forward transition.
const TERMINAL_STATUSES: ReadonlySet<ReportStatus> = new Set([
  "closed",
  "rejected",
  "withdrawn",
]);

export function StatusChangeModal({ report, onClose }: StatusChangeModalProps) {
  const validOptions = report.allowedTransitions;
  const updateStatus = useUpdateReportStatus(report.id);
  const [newStatus, setNewStatus] = useState<ReportStatus>(
    validOptions[0] ?? report.status,
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const isTerminal = TERMINAL_STATUSES.has(newStatus);

  const handleReview = () => {
    const trimmed = note.trim();
    if (!trimmed) {
      setError("A status change note is required");
      return;
    }
    setError(null);
    setConfirming(true);
  };

  const handleConfirm = () => {
    const trimmed = note.trim();
    updateStatus.mutate(
      { newStatus, body: trimmed },
      {
        onSuccess: () => {
          toast.success("Status updated");
          onClose();
        },
        onError: (err) => {
          const message =
            err instanceof ApiRequestError
              ? err.message
              : "Couldn't update the status.";
          setError(message);
        },
      },
    );
  };

  if (confirming) {
    return (
      <Modal title="Confirm status change" onClose={onClose}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-foreground">
            Change status from{" "}
            <span className="font-semibold">
              {STATUS_STYLES[report.status].label}
            </span>{" "}
            to{" "}
            <span className="font-semibold">
              {STATUS_STYLES[newStatus].label}
            </span>
            ?
          </p>

          {isTerminal && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {STATUS_STYLES[newStatus].label} is a terminal state. As part of
              normal workflow it cannot be reopened — only an Admin can reverse
              it to correct a mistake.
            </p>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <button
              onClick={() => setConfirming(false)}
              disabled={updateStatus.isPending}
              className="h-9 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={updateStatus.isPending}
              className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
            >
              {updateStatus.isPending ? "Saving…" : "Confirm change"}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Change status" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">New status</span>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          >
            {validOptions.map((value) => (
              <option key={value} value={value}>
                {STATUS_STYLES[value].label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Note</span>
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setError(null);
            }}
            maxLength={2000}
            rows={3}
            placeholder="Explain this status change…"
            className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </label>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="mt-1 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleReview}
            disabled={updateStatus.isPending}
            className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
          >
            Review change
          </button>
        </div>
      </div>
    </Modal>
  );
}
