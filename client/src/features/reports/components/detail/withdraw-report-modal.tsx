import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { ApiRequestError } from "@/lib/api";
import { useWithdrawReport } from "@/features/reports/hooks/use-withdraw-report";

interface WithdrawReportModalProps {
  reportId: string;
  onClose: () => void;
}

export function WithdrawReportModal({ reportId, onClose }: WithdrawReportModalProps) {
  const withdrawReport = useWithdrawReport(reportId);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleReview = () => {
    const trimmed = note.trim();
    if (!trimmed) {
      setError("A withdrawal note is required");
      return;
    }
    setError(null);
    setConfirming(true);
  };

  const handleConfirm = () => {
    const trimmed = note.trim();
    withdrawReport.mutate(
      { body: trimmed },
      {
        onSuccess: () => {
          toast.success("Report withdrawn.");
          onClose();
        },
        onError: (err) => {
          const message =
            err instanceof ApiRequestError
              ? err.message
              : "Couldn't withdraw the report. Please try again.";
          setError(message);
        },
      },
    );
  };

  if (confirming) {
    return (
      <Modal title="Confirm withdrawal" onClose={onClose}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-foreground">
            Withdraw this report? This cannot be undone.
          </p>

          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Withdrawn is a terminal state. Once withdrawn, the report cannot be
            reopened or acted upon.
          </p>

          <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground">
            {note.trim()}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <button
              onClick={() => setConfirming(false)}
              disabled={withdrawReport.isPending}
              className="h-9 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={withdrawReport.isPending}
              className="h-9 rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/80 disabled:opacity-50"
            >
              {withdrawReport.isPending ? "Withdrawing…" : "Confirm withdrawal"}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Withdraw report" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Explain why you are withdrawing this report. This note will be visible
          on the timeline.
        </p>

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
            placeholder="Reason for withdrawal…"
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
            disabled={withdrawReport.isPending}
            className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
          >
            Review withdrawal
          </button>
        </div>
      </div>
    </Modal>
  );
}
