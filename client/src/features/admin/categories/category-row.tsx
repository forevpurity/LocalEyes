import { useState, useRef } from "react";
import { Pencil, Trash2, AlertCircle } from "lucide-react";
import { useUpdateCategory } from "./hooks/use-update-category";
import { useDeleteCategory } from "./hooks/use-delete-category";
import type { Category } from "@/types/api";
import type { ApiRequestError } from "@/lib/api";
import { toast } from "sonner";

type RowMode = "view" | "edit" | "delete-confirm" | "delete-error";

interface CategoryRowProps {
  category: Category;
}

export function CategoryRow({ category }: CategoryRowProps) {
  const [mode, setMode] = useState<RowMode>("view");
  const [editName, setEditName] = useState(category.name);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const editInputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setMode("edit");
    setEditName(category.name);
    setEditError(null);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const cancelEdit = () => {
    setMode("view");
    setEditError(null);
  };

  const handleUpdate = () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError("Name is required");
      return;
    }
    setEditError(null);
    updateCat.mutate(
      { id: category.id, name: trimmed },
      {
        onSuccess: () => {
          setMode("view");
          toast.success("Category updated");
        },
        onError: (err) => {
          const apiErr = err as ApiRequestError;
          if (apiErr.status === 409) {
            setEditError(apiErr.message);
          }
        },
      },
    );
  };

  const startDelete = () => {
    setMode("delete-confirm");
  };

  const confirmDelete = () => {
    deleteCat.mutate(category.id, {
      onSuccess: () => {
        toast.success(`Category "${category.name}" deleted`);
      },
      onError: (err) => {
        const apiErr = err as ApiRequestError;
        if (apiErr.status === 422) {
          setDeleteError(apiErr.message);
          setMode("delete-error");
        }
      },
    });
  };

  const cancelDelete = () => {
    setMode("view");
    setDeleteError(null);
  };

  if (mode === "delete-error") {
    return (
      <tr className="border-b border-border bg-destructive/10 transition-colors last:border-none">
        <td colSpan={2} className="px-4 py-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-1.5 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
            <button
              onClick={cancelDelete}
              className="self-start rounded-md border border-border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className={`border-b border-border transition-colors last:border-none ${
        mode === "delete-confirm"
          ? "bg-destructive/5"
          : mode === "view"
          ? "hover:bg-muted/50"
          : ""
      }`}
    >
      {/* Name */}
      <td className="px-4 py-3">
        {mode === "edit" ? (
          <div className="flex flex-col gap-1">
            <input
              ref={editInputRef}
              type="text"
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value);
                setEditError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdate();
                if (e.key === "Escape") cancelEdit();
              }}
              className="w-full max-w-xs rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
            {editError && (
              <p className="text-xs text-destructive">{editError}</p>
            )}
          </div>
        ) : (
          <span className="font-medium text-foreground">{category.name}</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        {mode === "delete-confirm" ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-foreground">
              Delete &ldquo;{category.name}&rdquo;?
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={confirmDelete}
                disabled={deleteCat.isPending}
                className="rounded-md bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/80 disabled:opacity-50"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="rounded-md border border-border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : mode === "edit" ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUpdate}
              disabled={updateCat.isPending}
              className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="rounded-md border border-border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={startEdit}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={startDelete}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
