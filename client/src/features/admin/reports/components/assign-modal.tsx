import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { ApiRequestError } from "@/lib/api";
import { useDepartments } from "@/features/admin/departments/hooks/use-departments";
import { useAssignReport } from "../hooks/use-assign-report";
import type { Report } from "@/types/api";

interface AssignModalProps {
  report: Report;
  onClose: () => void;
}

export function AssignModal({ report, onClose }: AssignModalProps) {
  const { data: departments, isLoading } = useDepartments();
  const assign = useAssignReport(report.id);
  const [departmentId, setDepartmentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAssign = () => {
    if (!departmentId) {
      setError("Select a department");
      return;
    }
    setError(null);
    assign.mutate(departmentId, {
      onSuccess: () => {
        toast.success("Report assigned");
        onClose();
      },
      onError: (err) => {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Couldn't assign the report.";
        setError(message);
      },
    });
  };

  return (
    <Modal title={`Assign “${report.title}”`} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Department</span>
          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setError(null);
            }}
            disabled={isLoading}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          >
            <option value="">
              {isLoading ? "Loading…" : "Select a department…"}
            </option>
            {departments?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
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
            onClick={handleAssign}
            disabled={assign.isPending}
            className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
          >
            {assign.isPending ? "Assigning…" : "Assign"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
