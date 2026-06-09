import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useDepartments } from "./hooks/use-departments";
import { useCategories } from "@/features/admin/categories/hooks/use-categories";
import { useCreateDepartment } from "./hooks/use-create-department";
import { PolygonDrawer } from "./components/polygon-drawer";
import type { ApiRequestError } from "@/lib/api";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categories: z.array(z.string()).min(1, "At least one category is required"),
});

type FormValues = z.infer<typeof createSchema>;

export function DepartmentCreatePage() {
  const navigate = useNavigate();
  const [ring, setRing] = useState<[number, number][] | null>(null);
  const [polygonError, setPolygonError] = useState<string | null>(null);

  const { data: departments } = useDepartments();
  const { data: categories } = useCategories();
  const createDept = useCreateDepartment();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", categories: [] },
  });

  const selectedCategories = watch("categories");

  const handlePolygonComplete = (newRing: [number, number][]) => {
    setRing(newRing);
    setPolygonError(null);
  };

  const handlePolygonCancel = () => {
    setRing(null);
    setPolygonError(null);
  };

  const toggleCategory = (id: string) => {
    const current = selectedCategories;
    if (current.includes(id)) {
      setValue(
        "categories",
        current.filter((c) => c !== id),
      );
    } else {
      setValue("categories", [...current, id]);
    }
  };

  const onSubmit = (values: FormValues) => {
    if (!ring) {
      setPolygonError("Please draw a polygon on the map");
      return;
    }

    createDept.mutate(
      {
        name: values.name,
        polygon: { coordinates: [ring] },
        categories: values.categories,
      },
      {
        onSuccess: (data) => {
          toast.success(`Department "${data.name}" created successfully`);
          navigate("/departments");
        },
        onError: (err) => {
          const apiErr = err as ApiRequestError;
          if (apiErr.status === 422) {
            setPolygonError(apiErr.message);
          }
        },
      },
    );
  };

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
        <h1 className="mt-2 text-headline-sm font-semibold">
          Create Department
        </h1>
        <p className="text-body-sm text-muted-foreground">
          Draw the coverage area on the map and fill in the details
        </p>
      </div>

      {/* Content */}
      <div className="relative flex-1">
        <PolygonDrawer
          departments={departments ?? []}
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

            {/* Polygon status */}
            <div>
              <label className="mb-1 block text-label-sm font-medium text-foreground">
                Coverage Area
              </label>
              <div className="rounded-lg border border-border bg-muted/50 px-3 py-2">
                {ring ? (
                  <div className="space-y-1">
                    <p className="text-sm text-foreground">
                      {ring.length - 1} vertices
                      {ring[0][0] === ring[ring.length - 1][0] &&
                        ring[0][1] === ring[ring.length - 1][1] &&
                        " (closed)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Polygon drawn successfully
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click "Start Drawing" on the map to define the boundary
                  </p>
                )}
              </div>
              {polygonError && (
                <p className="mt-1 text-xs text-destructive">{polygonError}</p>
              )}
            </div>

            {/* Submit error */}
            {createDept.error &&
              (createDept.error as ApiRequestError).status !== 422 && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    {(createDept.error as ApiRequestError).message ||
                      "Failed to create department"}
                  </span>
                </div>
              )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || createDept.isPending}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
            >
              {createDept.isPending ? "Creating…" : "Create Department"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
