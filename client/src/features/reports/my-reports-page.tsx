import { Link } from "react-router";
import { FileText, Plus } from "lucide-react";
import { Navbar } from "@/features/layout/components/navbar";
import { ReportCard } from "@/features/reports/components/report-card";
import { useMyReports } from "@/features/reports/hooks/use-my-reports";

export function MyReportsPage() {
  const { data, isLoading, error } = useMyReports();
  const reports = data?.items ?? [];

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-72px)] bg-surface-container-low">
        <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-card-foreground md:text-headline-lg">
                My Reports
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Reports you've submitted to your local authorities.
              </p>
            </div>
            <Link
              to="/reports/new"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New report
            </Link>
          </div>

          {isLoading ? (
            <p className="py-16 text-center text-muted-foreground">Loading...</p>
          ) : error ? (
            <p className="py-16 text-center text-muted-foreground">
              Failed to load your reports.
            </p>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card py-16 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                You haven't filed any reports yet.
              </p>
              <Link
                to="/reports/new"
                className="text-sm font-medium text-primary hover:underline"
              >
                Report an issue
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
