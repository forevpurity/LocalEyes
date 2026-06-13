import { useState } from "react";
import { Loader2, Search, UserCircle } from "lucide-react";
import { useCitizens } from "./citizens/hooks/use-citizens";
import { CitizenRow } from "./citizens/components/citizen-row";

export function AdminCitizensPage() {
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"active" | "banned" | "">("");

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCitizens({
    status: status || undefined,
    name: name || undefined,
  });

  const citizens = data?.items ?? [];

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-headline-sm font-semibold">Citizens</h1>
        <p className="text-body-sm text-muted-foreground">
          Manage citizen accounts
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setName(search.trim());
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-56 rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </form>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "active" | "banned" | "")}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Created
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}

            {error && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-destructive"
                >
                  Failed to load citizens.
                  <button
                    onClick={() => window.location.reload()}
                    className="ml-1 underline hover:no-underline"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            )}

            {!isLoading && !error && citizens.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  <UserCircle className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  <p className="text-body-md font-medium">No citizens found</p>
                  <p className="text-body-sm mt-1">
                    Try adjusting your filters.
                  </p>
                </td>
              </tr>
            )}

            {citizens.map((citizen) => (
              <CitizenRow key={citizen.id} citizen={citizen} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
