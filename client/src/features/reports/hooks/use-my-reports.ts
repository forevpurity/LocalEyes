import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ListReportsResponse } from "@/types/api";

const PAGE_SIZE = 100;

/**
 * Fetches the citizen's own reports across every page. The list page runs
 * search/sort/stats entirely client-side, so it needs the full set rather than
 * a single page. We auto-advance through the cursor until the API stops
 * returning a `nextCursor`. A single citizen's report count is small, so this
 * is a handful of requests at most.
 */
export function useMyReports() {
  const query = useInfiniteQuery({
    queryKey: ["reports", "mine"],
    queryFn: ({ pageParam }) =>
      api<ListReportsResponse>(
        `/reports?mine=true&limit=${PAGE_SIZE}` +
          (pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""),
      ),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    ...query,
    data: query.data
      ? { items: query.data.pages.flatMap((page) => page.items) }
      : undefined,
    // Stay "loading" until every page has drained, so the UI never renders a
    // partial set that would skew search results and stat counts.
    isLoading: query.isLoading || hasNextPage,
  };
}
