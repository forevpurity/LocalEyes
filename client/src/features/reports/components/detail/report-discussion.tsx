import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useAuth } from "@/features/auth/use-auth";
import { useCreateComment } from "@/features/reports/hooks/use-create-comment";
import { useEditComment } from "@/features/reports/hooks/use-edit-comment";
import { useToggleCommentHide } from "@/features/reports/hooks/use-toggle-comment-hide";
import { canModerate, canEditComment } from "@/features/reports/lib/permissions";
import { getRoleBadge } from "@/features/reports/lib/role-styles";
import { getRelativeTime, cn } from "@/lib/utils";
import { ApiRequestError } from "@/lib/api";
import { Avatar } from "@/components/avatar";
import type { Comment, ReportDetail } from "@/types/api";

function CommentRow({
  reportId,
  comment,
  canModerate: canMod,
  report,
}: {
  reportId: string;
  comment: Comment;
  canModerate: boolean;
  report: ReportDetail;
}) {
  const editComment = useEditComment(reportId, comment.id);
  const toggleHide = useToggleCommentHide(reportId);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const canEdit = canEditComment(comment, report);

  const handleToggleHide = () => {
    toggleHide.mutate(comment.id, {
      onSuccess: () =>
        toast.success(comment.isHidden ? "Comment unhidden" : "Comment hidden"),
      onError: () => toast.error("Couldn't change comment visibility."),
    });
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || editComment.isPending) return;
    setError(null);
    editComment.mutate(trimmed, {
      onSuccess: () => setIsEditing(false),
      onError: (err) =>
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Failed to update comment.",
        ),
    });
  };

  const startEditing = () => {
    setDraft(comment.body ?? "");
    setError(null);
    setIsEditing(true);
  };

  // Collapsed placeholder for hidden comments (moderators only)
  if (comment.isHidden && canMod && !revealed) {
    return (
      <li className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <EyeOff className="h-3.5 w-3.5" />
        </span>
        <div className="flex flex-1 items-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            Hidden comment by{" "}
            <span className="font-medium text-foreground">
              {comment.authorName ?? "Anonymous"}
            </span>
            {" · "}
            {getRelativeTime(comment.createdAt)}
          </span>
          <button
            onClick={() => setRevealed(true)}
            className="shrink-0 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Reveal
          </button>
          <button
            onClick={handleToggleHide}
            disabled={toggleHide.isPending}
            className="shrink-0 text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
          >
            Unhide
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex gap-3">
      <Avatar
        src={comment.authorAvatarUrl}
        name={comment.authorName}
        size="sm"
      />
      <div
        className={cn(
          "min-w-0 flex-1 rounded-lg bg-surface-container-low px-3 py-2",
          comment.isHidden && "border-l-2 border-amber-400",
        )}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-card-foreground">
            {comment.authorName ?? "Anonymous"}
            {(() => {
              const badge = getRoleBadge(comment.authorRole);
              return badge ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                    badge.bg,
                    badge.text,
                  )}
                >
                  {badge.label}
                </span>
              ) : null;
            })()}
            {comment.isHidden && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Hidden
              </span>
            )}
          </span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {comment.isEdited && "edited · "}
            {getRelativeTime(comment.createdAt)}
          </span>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="mt-1.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={2000}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            <div className="mt-1.5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={editComment.isPending}
                className="h-8 rounded-lg px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!draft.trim() || editComment.isPending}
                className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {editComment.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="mt-0.5 text-sm leading-5 text-on-surface-variant">
              {comment.body}
            </p>
            <div className="mt-1 flex items-center gap-3">
              {canEdit && (
                <button
                  onClick={startEditing}
                  className="text-[11px] font-medium text-muted-foreground hover:text-primary"
                >
                  Edit
                </button>
              )}
              {canMod && comment.isHidden && (
                <button
                  onClick={() => setRevealed(false)}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  Collapse
                </button>
              )}
              {canMod && (
                <button
                  onClick={handleToggleHide}
                  disabled={toggleHide.isPending}
                  title={comment.isHidden ? "Unhide comment" : "Hide comment"}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                >
                  {comment.isHidden ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                  {comment.isHidden ? "Unhide" : "Hide"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </li>
  );
}

export function ReportDiscussion({ report }: { report: ReportDetail }) {
  const { user } = useAuth();
  const createComment = useCreateComment(report.id);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canMod = canModerate(report, user);
  const discussion = report.comments.filter(
    (c) => c.type === "discussion" && (canMod || !c.isHidden),
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || createComment.isPending) return;
    setError(null);
    createComment.mutate(trimmed, {
      onSuccess: () => setBody(""),
      onError: (err) =>
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Failed to post comment.",
        ),
    });
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-card-foreground">
          Community Discussion
        </h2>
        <span className="text-xs text-muted-foreground">
          {discussion.length}{" "}
          {discussion.length === 1 ? "Comment" : "Comments"}
        </span>
      </div>

      {discussion.length > 0 ? (
        <ul className="space-y-3">
          {discussion.map((c) => (
            <CommentRow
              key={c.id}
              reportId={report.id}
              comment={c}
              canModerate={canMod}
              report={report}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          {report.isLocked
            ? "No comments yet."
            : "No comments yet. Be the first to weigh in."}
        </p>
      )}

      {report.isLocked ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0" />
          <span>This report is locked.</span>
        </div>
      ) : user ? (
        <form onSubmit={handleSubmit} className="mt-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Write a comment…"
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          <div className="mt-2 flex sm:justify-end">
            <button
              type="submit"
              disabled={!body.trim() || createComment.isPending}
              className="h-9 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
            >
              {createComment.isPending ? "Posting…" : "Post Comment"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Log in to join the discussion.
        </p>
      )}
    </section>
  );
}
