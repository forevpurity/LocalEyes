import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useDepartments } from "./hooks/use-departments";
import { useCategories } from "@/features/admin/categories/hooks/use-categories";
import { useGetDepartment } from "./hooks/use-get-department";
import { useUpdateDepartment } from "./hooks/use-update-department";
import { PolygonDrawer } from "./components/polygon-drawer";
import type { ApiRequestError } from "@/lib/api";

const editSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categories: z.array(z.string()).min(1, "At least one category is required"),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof editSchema>;

export function DepartmentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editedRing, setEditedRing] = useState<[number, number][] | null>(null);
  const [polygonError, setPolygonError] = useState<string | null>(null);

  const {
    data: department,
    isLoading: isLoadingDept,
    error: deptError,
  } = useGetDepartment(id!);
  const { data: categories } = useCategories();
  const { data: departments } = useDepartments();
  const updateDept = useUpdateDepartment();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: "", categories: [], isActive: true },
  });

  const selectedCategories = watch("categories");
  const isActive = watch("isActive");

  // Pre-fill form when department loads
  useEffect(() => {
    if (department) {
      reset({
        name: department.name,
        categories: department.categories.map((c) => c.id),
        isActive: department.isActive,
      });
    }
  }, [department, reset]);

  const handlePolygonComplete = (newRing: [number, number][]) => {
    setEditedRing(newRing);
    setPolygonError(null);
  };

  const handlePolygonCancel = () => {
    setEditedRing(null);
    setPolygonError(null);
  };

  const toggleCategory = (catId: string) => {
    const current = selectedCategories;
    if (current.includes(catId)) {
      setValue(
        "categories",
        current.filter((c) => c !== catId),
      );
    } else {
      setValue("categories", [...current, catId]);
    }
  };

  const onSubmit = (values: FormValues) => {
    const payload: {
      id: string;
      name: string;
      categories: string[];
      isActive: boolean;
      polygon?: { coordinates: [number, number][][] };
    } = {
      id: id!,
      name: values.name,
      categories: values.categories,
      isActive: values.isActive,
    };

    if (editedRing) {
      payload.polygon = { coordinates: [editedRing] };
    }

    updateDept.mutate(payload, {
      onSuccess: (data) => {
        toast.success(`Department "${data.name}" updated successfully`);
        navigate("/departments");
      },
      onError: (err) => {
        const apiErr = err as ApiRequestError;
        if (apiErr.status === 422) {
          setPolygonError(apiErr.message);
        }
      },
    });
  };

  if (isLoadingDept) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (deptError || !department) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-destructive">Failed to load department.</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Retry
        </button>
      </div>
    );
  }

  const otherDepartments =
    departments?.filter((d) => d.id !== department.id) ?? [];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            to="/departments"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Departments
          </Link>
        </div>
        <h1 className="mt-2 text-headline-sm font-semibold">Edit Department</h1>
        <p className="text-body-sm text-muted-foreground">
          Update the coverage area, categories, or status of this department
        </p>
      </div>

      {/* Content */}
      <div className="relative flex-1">
        <PolygonDrawer
          departments={otherDepartments}
          initialPolygon={department.polygon}
          onComplete={handlePolygonComplete}
          onCancel={handlePolygonCancel}
        />

        {/* Floating form card */}
        <div className="absolute right-6 top-6 z-1000 max-h-[calc(100%-3rem)] w-80 overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-lg">
          <h2 className="text-label-md mb-4 font-medium text-foreground">
            Department Details
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-label-sm font-medium text-foreground">
                Name
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder="e.g. District 1"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Categories */}
            <div>
              <label className="mb-1 block text-label-sm font-medium text-foreground">
                Categories
              </label>
              <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
                {categories?.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 transition-colors hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="h-3.5 w-3.5 rounded border-border text-primary accent-primary"
                    />
                    <span className="text-sm text-foreground">{cat.name}</span>
                  </label>
                ))}
                {!categories?.length && (
                  <p className="px-1.5 py-1 text-xs text-muted-foreground">
                    No categories available
                  </p>
                )}
              </div>
              {errors.categories && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.categories.message}
                </p>
              )}
            </div>

            {/* Active toggle */}
            <div>
              <label className="mb-1 block text-label-sm font-medium text-foreground">
                Status
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2 transition-colors hover:bg-muted">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setValue("isActive", e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary accent-primary"
                />
                <span className="text-sm text-foreground">
                  {isActive ? "Active" : "Inactive"}
                </span>
              </label>
              {!isActive && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Inactive departments no longer receive new reports. Staff can
                  continue working on existing reports.
                </p>
              )}
              {isActive && department && !department.isActive && (
                <p className="mt-1 text-xs text-amber-600">
                  Reactivating requires the polygon to not overlap with other
                  active departments.
                </p>
              )}
            </div>

            {/* Polygon status */}
            <div>
              <label className="mb-1 block text-label-sm font-medium text-foreground">
                Coverage Area
              </label>
              <div className="rounded-lg border border-border bg-muted/50 px-3 py-2">
                {editedRing ? (
                  <div className="space-y-1">
                    <p className="text-sm text-foreground">
                      {editedRing.length - 1} vertices
                      {editedRing[0][0] ===
                        editedRing[editedRing.length - 1][0] &&
                        editedRing[0][1] ===
                          editedRing[editedRing.length - 1][1] &&
                        " (closed)"}
                    </p>
                    <p className="text-xs text-destructive">
                      New polygon will replace the existing coverage area
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Existing coverage area shown on the map. Click "Start
                    Drawing" to redefine.
                  </p>
                )}
              </div>
              {polygonError && (
                <p className="mt-1 text-xs text-destructive">{polygonError}</p>
              )}
            </div>

            {/* Submit error */}
            {updateDept.error &&
              (updateDept.error as ApiRequestError).status !== 422 && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    {(updateDept.error as ApiRequestError).message ||
                      "Failed to update department"}
                  </span>
                </div>
              )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || updateDept.isPending}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
            >
              {updateDept.isPending ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
