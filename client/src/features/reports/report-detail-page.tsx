import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { MOCK_REPORTS } from "@/features/reports/data/mock-reports";

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const report = MOCK_REPORTS.find((r) => r.id === id);

  if (!report) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Report not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-xl font-bold text-primary">{report.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{report.description}</p>

      <div className="mt-6 space-y-2 text-sm">
        <p><span className="font-medium">Status:</span> {report.status}</p>
        <p><span className="font-medium">Category:</span> {report.categoryIcon} {report.categoryName}</p>
        <p><span className="font-medium">Address:</span> {report.address ?? "—"}</p>
        <p><span className="font-medium">Votes:</span> {report.voteCount}</p>
      </div>
    </div>
  );
}
