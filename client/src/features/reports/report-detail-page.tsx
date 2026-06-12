import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Bell,
  Building2,
  CalendarClock,
  MapPin,
  ThumbsUp,
  UserRound,
} from "lucide-react";
import { Navbar } from "@/features/layout/components/navbar";
import { useReport } from "@/features/reports/hooks/use-report";
import { useToggleVote } from "@/features/reports/hooks/use-toggle-vote";
import { useToggleSubscribe } from "@/features/reports/hooks/use-toggle-subscribe";
import { useAuth } from "@/features/auth/auth-context";
import { getCategoryIcon } from "@/features/reports/lib/category-icons";
import { getStatusStyle } from "@/features/reports/lib/status-styles";
import { getRelativeTime, cn } from "@/lib/utils";
import { ReportTimeline } from "@/features/reports/components/detail/report-timeline";
import { ReportLocationCard } from "@/features/reports/components/detail/report-location-card";
import { ReportDiscussion } from "@/features/reports/components/detail/report-discussion";
import { ReportPhotoGallery } from "@/features/reports/components/detail/report-photo-gallery";

function MetaItem({
  icon: Icon,
  value,
}: {
  icon: typeof MapPin;
  value: string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-on-surface-variant">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="truncate">{value}</span>
    </span>
  );
}

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, error } = useReport(id);
  const { user } = useAuth();
  const toggleVote = useToggleVote(id ?? "");
  const toggleSubscribe = useToggleSubscribe(id ?? "");

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex h-[calc(100vh-72px)] items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  if (error || !report) {
    return (
      <>
        <Navbar />
        <div className="flex h-[calc(100vh-72px)] items-center justify-center">
          <p className="text-muted-foreground">Report not found.</p>
        </div>
      </>
    );
  }

  const categoryIcon = getCategoryIcon({
    id: report.categoryId,
    name: report.categoryName,
  });
  const status = getStatusStyle(report.status);
  const isCitizen = user?.role === "citizen";
  const canVote = isCitizen && !report.isOwner;

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-72px)] bg-surface-container-low">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
            <div className="space-y-5">
              <section className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase text-muted-foreground">
                    <span aria-hidden="true">{categoryIcon}</span>
                    {report.categoryName}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase",
                      status.bg,
                      status.text,
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {status.label}
                  </span>
                </div>

                <h1 className="mt-4 text-2xl font-bold leading-tight text-card-foreground md:text-headline-lg">
                  {report.title}
                </h1>

                <div className="mt-5">
                  <ReportPhotoGallery photos={report.photos} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4">
                  <MetaItem
                    icon={MapPin}
                    value={report.address ?? "Pinned location"}
                  />
                  <MetaItem
                    icon={CalendarClock}
                    value={getRelativeTime(report.createdAt)}
                  />
                  <MetaItem
                    icon={UserRound}
                    value={report.citizenName ?? "Anonymous"}
                  />
                  <MetaItem
                    icon={Building2}
                    value={report.departmentName ?? "Unassigned"}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <button
                    onClick={() => toggleVote.mutate()}
                    disabled={!canVote || toggleVote.isPending}
                    className={cn(
                      "inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed",
                      report.hasVoted
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card text-foreground hover:border-primary/50 hover:text-primary",
                      !canVote && "opacity-70",
                    )}
                    title={
                      report.isOwner
                        ? "You can't vote on your own report"
                        : isCitizen
                          ? undefined
                          : "Sign in as a citizen to upvote"
                    }
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {report.voteCount}{" "}
                    {report.voteCount === 1 ? "Upvote" : "Upvotes"}
                  </button>

                  {isCitizen && (
                    <button
                      onClick={() => toggleSubscribe.mutate()}
                      disabled={report.isOwner || toggleSubscribe.isPending}
                      className={cn(
                        "inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                        report.isSubscribed
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-primary",
                      )}
                      title={
                        report.isOwner
                          ? "You automatically receive updates on your own report"
                          : undefined
                      }
                    >
                      <Bell
                        className={cn(
                          "h-4 w-4",
                          report.isSubscribed && "fill-current",
                        )}
                      />
                      {report.isSubscribed
                        ? "Subscribed to updates"
                        : "Subscribe to updates"}
                    </button>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-card-foreground">
                    Report Description
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {report.description.length} characters
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-on-surface-variant">
                  {report.description}
                </p>
              </section>

              <ReportDiscussion report={report} />
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <ReportTimeline report={report} />
              <ReportLocationCard report={report} />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
