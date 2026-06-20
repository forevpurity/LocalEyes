import { Link } from "react-router";
import type { Report } from "@/types/api";
import { getRelativeTime } from "@/lib/utils";
import {
  getStatusStyle,
  getStatusColor,
} from "@/features/reports/lib/status-styles";
import { useRecentReports } from "@/features/reports/hooks/use-recent-reports";

export function ActivityFeed() {
  const { data: reports, isLoading } = useRecentReports(3);

  // Hide the section entirely once we know there are no reports to show.
  if (!isLoading && (!reports || reports.length === 0)) {
    return null;
  }

  return (
    <section className="py-16 md:py-[120px] bg-surface">
      <div className="max-w-[1120px] mx-auto px-4 md:px-12 flex flex-col gap-16">
        <div className="flex flex-col sm:flex-row justify-between items-end gap-6 border-b border-outline-variant pb-6">
          <div className="flex flex-col gap-3">
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface flex items-center gap-3">
              Live Activity Feed
              <span className="relative flex h-3 w-3 mt-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-70 dark:bg-red-500"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.45)] dark:bg-red-400 dark:shadow-[0_0_12px_rgba(248,113,113,0.4)]"></span>
              </span>
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Recent reports submitted by citizens across the city.
            </p>
          </div>
          <Link
            to="/map"
            className="text-primary font-label-md text-label-md hover:text-primary/80 transition-colors flex items-center gap-1 group"
          >
            View All Reports{" "}
            <span
              className="material-symbols-outlined transform group-hover:translate-x-1 transition-transform"
              style={{ fontSize: "16px" }}
            >
              arrow_forward
            </span>
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <ActivityCardSkeleton key={i} />
              ))
            : reports!.map((report) => (
                <ActivityCard key={report.id} report={report} />
              ))}
        </div>
      </div>
    </section>
  );
}

function ActivityCard({ report }: { report: Report }) {
  const style = getStatusStyle(report.status);
  const photo = report.photos?.[0]?.url;

  return (
    <Link
      to={`/reports/${report.id}`}
      className="group bg-surface rounded-2xl shadow-sm border border-outline-variant/50 overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-outline-variant"
    >
      <div className="h-[200px] bg-surface-container relative overflow-hidden group">
        {photo ? (
          <img
            alt={report.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={photo}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-variant transition-transform duration-500 group-hover:scale-105">
            <span
              className="material-symbols-outlined text-outline/50"
              style={{ fontSize: "56px" }}
            >
              image
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-3 right-3 bg-surface/95 text-on-surface font-label-sm text-label-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md backdrop-blur-md">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: getStatusColor(report.status) }}
          />
          {style.label}
        </div>
      </div>
      <div className="p-10 flex flex-col gap-3 grow">
        <span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
          {report.categoryName}
        </span>
        <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1">
          {report.title}
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "16px" }}
          >
            schedule
          </span>{" "}
          {getRelativeTime(report.createdAt)}
        </p>
        <div className="mt-auto pt-6 border-t border-outline-variant/40 flex gap-6 text-outline">
          <div className="flex items-center gap-1 font-label-sm text-label-sm">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px" }}
            >
              thumb_up
            </span>{" "}
            {report.voteCount}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ActivityCardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/50 overflow-hidden flex flex-col animate-pulse">
      <div className="h-[200px] bg-surface-variant"></div>
      <div className="p-10 flex flex-col gap-3 grow">
        <div className="h-3 w-20 rounded bg-surface-variant"></div>
        <div className="h-5 w-3/4 rounded bg-surface-variant"></div>
        <div className="h-3 w-24 rounded bg-surface-variant"></div>
        <div className="mt-auto pt-6 border-t border-outline-variant/40">
          <div className="h-4 w-12 rounded bg-surface-variant"></div>
        </div>
      </div>
    </div>
  );
}
