import { useState } from "react";
import { createPortal } from "react-dom";
import { Building2 } from "lucide-react";
import { ReportRow as SharedReportRow } from "@/features/reports/components/report-row";
import { AssignModal } from "./assign-modal";
import type { Report } from "@/types/api";

interface ReportRowProps {
  report: Report;
}

/** Admin-specific row: wraps the shared ReportRow and adds the Assign action. */
export function ReportRow({ report }: ReportRowProps) {
  const [assigning, setAssigning] = useState(false);

  return (
    <>
      <SharedReportRow
        report={report}
        extraActions={
          !report.departmentId ? (
            <button
              onClick={() => setAssigning(true)}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Assign to department"
            >
              <Building2 className="h-4 w-4" />
            </button>
          ) : undefined
        }
      />
      {assigning && (
        createPortal(
          <AssignModal report={report} onClose={() => setAssigning(false)} />,
          document.body,
        )
      )}
    </>
  );
}
