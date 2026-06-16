import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError, getRetryAfterSeconds } from "@/lib/api";

function formatRetryHint(seconds: number | undefined): string | undefined {
  if (seconds === undefined) return undefined;
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);
    return `Try again in ~${minutes} min.`;
  }
  return `Try again in ~${Math.ceil(seconds)} sec.`;
}

/**
 * Centralized 429 handling: any rate-limited request (auth, password reset,
 * report create, comments, votes, …) surfaces one deduped toast. The fixed id
 * collapses a burst of 429s into a single notification. Runs in addition to a
 * mutation's own `onError`, so per-form handling is unaffected.
 */
function handleRateLimit(error: unknown) {
  if (!(error instanceof ApiRequestError) || error.status !== 429) return;
  toast.error(error.message, {
    id: "rate-limit",
    description: formatRetryHint(getRetryAfterSeconds(error)),
  });
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleRateLimit }),
  mutationCache: new MutationCache({ onError: handleRateLimit }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});
