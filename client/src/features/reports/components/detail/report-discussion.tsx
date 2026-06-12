import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useCreateComment } from "@/features/reports/hooks/use-create-comment";
import { getRelativeTime } from "@/lib/utils";
import { ApiRequestError } from "@/lib/api";
import type { Comment, ReportDetail } from "@/types/api";

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function CommentRow({ comment }: { comment: Comment }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-xs font-semibold text-muted-foreground">
        {initials(comment.authorName)}
      </span>
      <div className="min-w-0 flex-1 rounded-lg bg-surface-container-low px-3 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold text-card-foreground">
            {comment.authorName ?? "Anonymous"}
          </span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {getRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 text-sm leading-5 text-on-surface-variant">
          {comment.body}
        </p>
      </div>
    </li>
  );
}

export function ReportDiscussion({ report }: { report: ReportDetail }) {
  const { user } = useAuth();
  const createComment = useCreateComment(report.id);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const discussion = report.comments.filter(
    (c) => c.type === "discussion" && !c.isHidden,
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
            <CommentRow key={c.id} comment={c} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No comments yet. Be the first to weigh in.
        </p>
      )}

      {user ? (
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
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={!body.trim() || createComment.isPending}
              className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
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
