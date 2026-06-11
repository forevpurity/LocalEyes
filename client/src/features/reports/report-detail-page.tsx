import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useReport } from "@/features/reports/hooks/use-report";
import { getCategoryIcon } from "@/features/reports/lib/category-icons";

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, error } = useReport(id);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Report not found.</p>
      </div>
    );
  }

  const photo = report.photos?.[0]?.url;
  const categoryIcon = getCategoryIcon({ id: report.categoryId, name: report.categoryName });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {photo && (
        <img
          src={photo}
          alt=""
          className="mb-4 h-48 w-full rounded-lg border border-border object-cover"
        />
      )}

      <h1 className="text-xl font-bold text-primary">{report.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{report.description}</p>

      <div className="mt-6 space-y-2 text-sm">
        <p><span className="font-medium">Status:</span> {report.status}</p>
        <p><span className="font-medium">Category:</span> {categoryIcon} {report.categoryName}</p>
        <p><span className="font-medium">Address:</span> {report.address ?? "—"}</p>
        <p><span className="font-medium">Votes:</span> {report.voteCount}</p>
        <p><span className="font-medium">Department:</span> {report.departmentName ?? "Unassigned"}</p>
        <p><span className="font-medium">Reported by:</span> {report.citizenName ?? "Anonymous"}</p>
      </div>
    </div>
  );
}
