import { useState } from "react";
import { Loader2, Plus, Search, Users } from "lucide-react";
import { useStaff } from "./staff/hooks/use-staff";
import { StaffRow } from "./staff/components/staff-row";
import { CreateStaffModal } from "./staff/components/create-staff-modal";
import { useDepartments } from "./departments/hooks/use-departments";

export function AdminStaffPage() {
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"active" | "banned" | "">("");
  const [departmentId, setDepartmentId] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: departments } = useDepartments();
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStaff({
    status: status || undefined,
    departmentId: departmentId || undefined,
    name: name || undefined,
  });

  const staffList = data?.items ?? [];

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-headline-sm font-semibold">Staff</h1>
          <p className="text-body-sm text-muted-foreground">
            Manage staff accounts
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          <Plus className="h-4 w-4" />
          Add staff
        </button>
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
          onChange={(e) =>
            setStatus(e.target.value as "active" | "banned" | "")
          }
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>

        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        >
          <option value="">All departments</option>
          {departments?.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
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
                Department
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
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}

            {error && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-destructive"
                >
                  Failed to load staff.
                  <button
                    onClick={() => window.location.reload()}
                    className="ml-1 underline hover:no-underline"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            )}

            {!isLoading && !error && staffList.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  <p className="text-body-md font-medium">No staff found</p>
                  <p className="text-body-sm mt-1">
                    Try adjusting your filters or add a staff member.
                  </p>
                </td>
              </tr>
            )}

            {staffList.map((staff) => (
              <StaffRow key={staff.id} staff={staff} />
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

      {showCreate && <CreateStaffModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
