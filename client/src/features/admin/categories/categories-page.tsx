import { useState } from "react";
import { Plus, Shield, Loader2 } from "lucide-react";
import { useCategories } from "./hooks/use-categories";
import { useCreateCategory } from "./hooks/use-create-category";
import { CategoryRow } from "./category-row";
import type { ApiRequestError } from "@/lib/api";
import { toast } from "sonner";

export function AdminCategoriesPage() {
  const { data: categories, isLoading, error } = useCategories();

  const [newName, setNewName] = useState("");
  const [newNameError, setNewNameError] = useState<string | null>(null);

  const createCat = useCreateCategory();

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setNewNameError("Name is required");
      return;
    }
    setNewNameError(null);
    createCat.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          setNewName("");
          toast.success("Category created");
        },
        onError: (err) => {
          const apiErr = err as ApiRequestError;
          if (apiErr.status === 409) {
            setNewNameError(apiErr.message);
          }
        },
      },
    );
  };

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-headline-sm font-semibold">Categories</h1>
          <p className="text-body-sm text-muted-foreground">
            Manage problem categories
          </p>
        </div>
      </div>

      {/* Create */}
      <div className="mb-4 flex items-start gap-2">
        <div className="flex max-w-sm flex-1 flex-col gap-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewNameError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              placeholder="New category name…"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
            <button
              onClick={handleCreate}
              disabled={createCat.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          {newNameError && (
            <p className="text-xs text-destructive">{newNameError}</p>
          )}
        </div>
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
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}

            {error && (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-8 text-center text-sm text-destructive"
                >
                  Failed to load categories.
                  <button
                    onClick={() => window.location.reload()}
                    className="ml-1 underline hover:no-underline"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            )}

            {!isLoading && !error && categories?.length === 0 && (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  <Shield className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  <p className="text-body-md font-medium">No categories yet</p>
                  <p className="text-body-sm mt-1">
                    Create your first category above.
                  </p>
                </td>
              </tr>
            )}

            {categories?.map((cat) => (
              <CategoryRow key={cat.id} category={cat} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
