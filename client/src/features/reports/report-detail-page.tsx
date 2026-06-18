import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Bell,
  Building2,
  CalendarClock,
  MapPin,
  Pencil,
  ThumbsUp,
  UserRound,
  XCircle,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/features/layout/components/navbar";
import { useReport } from "@/features/reports/hooks/use-report";
import { useToggleVote } from "@/features/reports/hooks/use-toggle-vote";
import { useToggleSubscribe } from "@/features/reports/hooks/use-toggle-subscribe";
import { useWithdrawReport } from "@/features/reports/hooks/use-withdraw-report";
import { useRemoveReportPhoto } from "@/features/reports/hooks/use-remove-report-photo";
import { useAuth } from "@/features/auth/auth-context";
import { getCategoryIcon } from "@/features/reports/lib/category-icons";
import { getStatusStyle } from "@/features/reports/lib/status-styles";
import { getRelativeTime, cn } from "@/lib/utils";
import { ReportTimeline } from "@/features/reports/components/detail/report-timeline";
import { ReportLocationCard } from "@/features/reports/components/detail/report-location-card";
import { ReportDiscussion } from "@/features/reports/components/detail/report-discussion";
import { ReportPhotoGallery } from "@/features/reports/components/detail/report-photo-gallery";
import { ResolutionPhotoUpload } from "@/features/reports/components/detail/resolution-photo-upload";
import { ReportEditForm } from "@/features/reports/components/detail/report-edit-form";
import { StatusChangeModal } from "@/features/reports/components/detail/status-change-modal";
import { ReportFlagBadges } from "@/features/reports/components/report-flag-badges";
import {
  canModerate,
  canVote,
  canEditReport,
} from "@/features/reports/lib/permissions";

function MetaItem({
  icon: Icon,
  value,
}: {
  icon: typeof MapPin;
  value: string;
}) {
  return (
    <span className="flex min-w-0 max-w-full items-start gap-1.5 text-sm text-on-surface-variant sm:items-center">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground sm:mt-0"
        aria-hidden="true"
      />
      <span className="wrap-break-word sm:truncate">{value}</span>
    </span>
  );
}

function ManagedDetailTopBar({
  label,
  onBack,
}: {
  label: string;
  onBack: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4 md:px-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {label}
        </button>
      </div>
    </header>
  );
}

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, error } = useReport(id);
  const { user } = useAuth();
  const toggleVote = useToggleVote(id ?? "");
  const toggleSubscribe = useToggleSubscribe(id ?? "");
  const withdrawReport = useWithdrawReport(id ?? "");
  const removePhoto = useRemoveReportPhoto(id ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const isStaff = user?.role === "staff";
  const isAdmin = user?.role === "admin";
  const usesManagedChrome = isStaff || isAdmin;
  const handleBack = () => {
    if (isStaff) {
      navigate("/queue");
      return;
    }
    if (isAdmin) {
      navigate("/reports");
      return;
    }
    navigate(-1);
  };
  const pageChrome = usesManagedChrome ? (
    <ManagedDetailTopBar
      label={isAdmin ? "Back to reports" : "Back to queue"}
      onBack={handleBack}
    />
  ) : (
    <Navbar />
  );
  // Managed chrome (top bar) is 64px tall; the citizen Navbar is 72px. These
  // class strings must stay literal so Tailwind's JIT scanner can emit them.
  const mainClassName = usesManagedChrome
    ? "min-h-[calc(100vh-64px)] bg-surface-container-low"
    : "min-h-[calc(100vh-72px)] bg-surface-container-low";
  const contentHeight = usesManagedChrome
    ? "h-[calc(100vh-64px)]"
    : "h-[calc(100vh-72px)]";

  if (isLoading) {
    return (
      <>
        {pageChrome}
        <div className={cn("flex items-center justify-center", contentHeight)}>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  if (error || !report) {
    return (
      <>
        {pageChrome}
        <div className={cn("flex items-center justify-center", contentHeight)}>
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
  const canMod = canModerate(report, user);

  const handleWithdraw = () => {
    if (withdrawReport.isPending) return;
    if (!window.confirm("Withdraw this report? This cannot be undone.")) return;
    withdrawReport.mutate(undefined, {
      onSuccess: () => toast.success("Report withdrawn."),
      onError: () =>
        toast.error("Couldn't withdraw the report. Please try again."),
    });
  };

  return (
    <>
      {pageChrome}
      <main className={mainClassName}>
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
          {!usesManagedChrome && (
            <button
              onClick={handleBack}
              className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}

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
                  <ReportFlagBadges
                    isHidden={report.isHidden}
                    isLocked={report.isLocked}
                    size="sm"
                  />
                </div>

                <h1 className="mt-4 text-2xl font-bold leading-tight text-card-foreground md:text-headline-lg">
                  {report.title}
                </h1>

                <div className="mt-5 space-y-4">
                  {/* Single gallery; before/after photos are labeled inline */}
                  <ReportPhotoGallery
                    photos={report.photos}
                    canManage={isStaff || isAdmin}
                    onRemove={(photoId) => {
                      removePhoto.mutate(photoId, {
                        onError: () =>
                          toast.error("Couldn't remove the photo. Please try again."),
                      });
                    }}
                  />
                  {(isStaff || isAdmin) && (
                    <ResolutionPhotoUpload
                      reportId={report.id}
                      afterPhotoCount={report.photos.filter((p) => p.kind === "after").length}
                    />
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
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

                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <button
                      onClick={() =>
                        toggleVote.mutate(undefined, {
                          onError: () =>
                            toast.error("Couldn't register your vote."),
                        })
                      }
                      disabled={!canVote(report, user) || toggleVote.isPending}
                      className={cn(
                        "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed sm:w-auto sm:justify-start",
                        report.hasVoted
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card text-foreground hover:border-primary/50 hover:text-primary",
                        !canVote(report, user) && "opacity-70",
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
                        onClick={() =>
                          toggleSubscribe.mutate(undefined, {
                            onSuccess: (data) =>
                              toast.success(
                                data.subscribed
                                  ? "Subscribed to updates."
                                  : "Unsubscribed from updates.",
                              ),
                            onError: () =>
                              toast.error("Couldn't update your subscription."),
                          })
                        }
                        disabled={report.isOwner || toggleSubscribe.isPending}
                        className={cn(
                          "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:justify-start",
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

                  {canEditReport(report) && !isEditing && (
                    <div className="flex w-full gap-2 sm:w-auto sm:items-center">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary sm:flex-none sm:justify-start"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={handleWithdraw}
                        disabled={withdrawReport.isPending}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:justify-start"
                      >
                        <XCircle className="h-4 w-4" />
                        {withdrawReport.isPending ? "Withdrawing…" : "Withdraw"}
                      </button>
                    </div>
                  )}

                  {canMod && report.allowedTransitions.length > 0 && (
                    <div className="flex w-full gap-2 sm:w-auto sm:items-center">
                      <button
                        onClick={() => setChangingStatus(true)}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary sm:w-auto sm:justify-start"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        Change status
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {isEditing ? (
                <ReportEditForm
                  report={report}
                  onDone={() => setIsEditing(false)}
                />
              ) : (
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
              )}

              <ReportDiscussion report={report} />
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <ReportTimeline report={report} />
              <ReportLocationCard report={report} />
            </aside>
          </div>
        </div>
      </main>

      {changingStatus && (
        <StatusChangeModal
          report={report}
          onClose={() => setChangingStatus(false)}
        />
      )}
    </>
  );
}
