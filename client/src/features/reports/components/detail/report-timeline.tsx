import type { ReportDetail } from "@/types/api";
import { formatDateTime } from "@/lib/utils";
import { getStatusColor, getStatusStyle } from "@/features/reports/lib/status-styles";

interface TimelineEvent {
  status: string;
  title: string;
  body: string | null;
  author: string | null;
  createdAt: string;
}

function buildEvents(report: ReportDetail): TimelineEvent[] {
  const statusNotes = report.comments
    .filter((c) => c.type === "status_note" && c.newStatus)
    .map<TimelineEvent>((c) => ({
      status: c.newStatus!,
      title: getStatusStyle(c.newStatus!).label,
      body: c.body,
      author: c.authorName,
      createdAt: c.createdAt,
    }));

  const submitted: TimelineEvent = {
    status: "submitted",
    title: "Issue Submitted",
    body: null,
    author: report.citizenName,
    createdAt: report.createdAt,
  };

  // Newest first, with the original submission anchoring the bottom.
  return [...statusNotes, submitted].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function ReportTimeline({ report }: { report: ReportDetail }) {
  const events = buildEvents(report);

  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-card-foreground">
          Issue Timeline
        </h2>
        <p className="text-[11px] font-medium uppercase text-muted-foreground">
          Resolution pathway
        </p>
      </header>

      <ol className="space-y-5 p-4">
        {events.map((event, i) => {
          const color = getStatusColor(event.status);
          const isLast = i === events.length - 1;
          return (
            <li key={`${event.status}-${event.createdAt}`} className="relative flex gap-3">
              {!isLast && (
                <span
                  className="absolute left-[11px] top-6 h-[calc(100%+0.25rem)] w-px bg-border"
                  aria-hidden="true"
                />
              )}
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${color}1a` }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-card-foreground">
                  {event.title}
                </p>
                {event.body && (
                  <p className="mt-0.5 text-xs leading-5 text-on-surface-variant">
                    {event.body}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {event.author && `${event.author} · `}
                  {formatDateTime(event.createdAt)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
