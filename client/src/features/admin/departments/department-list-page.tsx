import { Link } from "react-router";
import { Plus, Pencil, Shield } from "lucide-react";
import { useState } from "react";
import { useDepartments } from "@/features/admin/hooks/use-departments";
import { DepartmentMap } from "./components/department-map";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DepartmentListPage() {
  const { data: departments, isLoading, error } = useDepartments();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-headline-sm font-semibold">Departments</h1>
          <p className="text-body-sm text-muted-foreground">
            Manage city departments and their coverage areas
          </p>
        </div>
        <Link
          to="/departments/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          <Plus className="h-4 w-4" />
          Create Department
        </Link>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Table */}
        <div className="flex flex-1 flex-col rounded-lg border border-border bg-card">
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Categories
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
                      Loading departments…
                    </td>
                  </tr>
                )}

                {error && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-destructive"
                    >
                      Failed to load departments.
                      <button
                        onClick={() => window.location.reload()}
                        className="ml-1 underline hover:no-underline"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                )}

                {!isLoading && !error && departments?.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      <Shield className="mx-auto mb-2 h-8 w-8 opacity-40" />
                      <p className="text-body-md font-medium">
                        No departments yet
                      </p>
                      <p className="text-body-sm mt-1">
                        Create your first department to get started.
                      </p>
                    </td>
                  </tr>
                )}

                {departments?.map((dept) => (
                  <tr
                    key={dept.id}
                    className={`cursor-pointer border-b border-border transition-colors last:border-none hover:bg-muted/50 ${
                      selectedId === dept.id
                        ? "border-l-2 border-l-primary bg-primary/10"
                        : "border-l-2 border-l-transparent"
                    }`}
                    onClick={() =>
                      setSelectedId((id) => (id === dept.id ? null : dept.id))
                    }
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {dept.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex flex-wrap gap-1">
                        {dept.categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat.id}
                            className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                          >
                            {cat.name}
                          </span>
                        ))}
                        {dept.categories.length > 3 && (
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            +{dept.categories.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          dept.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {dept.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(dept.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/departments/${dept.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Map */}
        <div className="flex w-105 shrink-0 flex-col rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-label-md font-medium text-foreground">
              Coverage Map
            </h2>
            <p className="text-label-sm text-muted-foreground">
              {departments?.length ?? 0} department
              {departments && departments.length !== 1 ? "s" : ""} shown
            </p>
          </div>
          <div className="relative flex-1 overflow-hidden rounded-b-lg">
            <DepartmentMap
              departments={departments ?? []}
              selectedDepartmentId={selectedId}
              onSelectDepartment={setSelectedId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
