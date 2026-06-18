import { useState, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Upload,
  X,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportContentSchema } from "@/features/reports/lib/report-schema";
import type { CoveringResponse } from "@/types/api";

const schema = z.object({
  ...reportContentSchema.shape,
  categoryId: z.string().min(1, "Please select a category"),
  photos: z
    .array(z.instanceof(File))
    .min(1, "At least 1 photo is required")
    .max(5, "Maximum 5 photos allowed"),
});

type FormValues = z.infer<typeof schema>;

interface ReportDetailsStepProps {
  covering: CoveringResponse | undefined;
  coveringLoading: boolean;
  coveringError: Error | null;
  initialData?: {
    title: string;
    description: string;
    categoryId: string;
    photos: File[];
  };
  onNext: (details: {
    title: string;
    description: string;
    categoryId: string;
    photos: File[];
  }) => void;
  onBack: () => void;
}

export function ReportDetailsStep({
  covering,
  coveringLoading,
  coveringError,
  initialData,
  onNext,
  onBack,
}: ReportDetailsStepProps) {
  const [photoFiles, setPhotoFiles] = useState<File[]>(initialData?.photos ?? []);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      categoryId: initialData?.categoryId ?? "",
      photos: initialData?.photos ?? [],
    },
    mode: "onChange",
  });

  // Regenerate photo previews from initial data on mount
  useEffect(() => {
    if (initialData?.photos && initialData.photos.length > 0) {
      const previews = initialData.photos.map((f) => URL.createObjectURL(f));
      setPhotoPreviews(previews);
    }
  }, []);

  const watchedPhotos = watch("photos");

  const addPhotos = useCallback(
    (newFiles: File[]) => {
      setPhotoFiles((prev) => {
        const merged = [...prev, ...newFiles].slice(0, 5);
        setValue("photos", merged, { shouldValidate: true });
        return merged;
      });
      setPhotoPreviews((prev) => {
        const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
        return [...prev, ...newPreviews].slice(0, 5);
      });
    },
    [setValue],
  );

  const removePhoto = useCallback(
    (index: number) => {
      setPhotoFiles((prev) => {
        const next = prev.filter((_, i) => i !== index);
        setValue("photos", next, { shouldValidate: true });
        return next;
      });
      setPhotoPreviews((prev) => {
        URL.revokeObjectURL(prev[index]);
        return prev.filter((_, i) => i !== index);
      });
    },
    [setValue],
  );

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length) addPhotos(files);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length) addPhotos(files);
  };

  const onSubmit = (values: FormValues) => {
    onNext({
      title: values.title,
      description: values.description,
      categoryId: values.categoryId,
      photos: values.photos,
    });
  };

  const categories = covering?.categories ?? [];
  const department = covering?.department ?? null;
  const showErrorFallback = coveringError != null && !coveringLoading;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-xl font-semibold text-foreground">Issue Details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Please provide specific information to help council services resolve this quickly.
          </p>
          <p className="mt-2 text-xs text-amber-700">
            A photo is required to submit. Snap one at the location before you start.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Report Title
              </label>
              <input
                {...register("title")}
                type="text"
                placeholder="e.g., Deep pothole on District 1 main road"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </label>

              {/* Department info */}
              {!coveringLoading && department && (
                <p className="mb-2 text-xs text-muted-foreground">
                  Assigned to: <span className="font-medium text-foreground">{department.name}</span>
                </p>
              )}
              {!coveringLoading && !department && !showErrorFallback && (
                <p className="mb-2 text-xs text-muted-foreground">
                  Not covered by any department — an admin will assign it.
                </p>
              )}

              {/* Select */}
              <div className="relative">
                <select
                  {...register("categoryId")}
                  disabled={coveringLoading || categories.length === 0}
                  className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors disabled:opacity-60 focus:border-primary focus:ring-1 focus:ring-primary/20"
                >
                  <option value="">
                    {coveringLoading
                      ? "Detecting coverage area..."
                      : categories.length === 0
                        ? "No categories available"
                        : "Select an issue type"}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                {coveringLoading && (
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              {errors.categoryId && (
                <p className="mt-1 text-xs text-destructive">{errors.categoryId.message}</p>
              )}

              {showErrorFallback && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Could not detect coverage area. An admin will assign your report manually.
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Detailed Description
              </label>
              <textarea
                {...register("description")}
                rows={4}
                placeholder="Tell us more about the issue, exact location markers, or impact on the community..."
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Photos */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Photos & Attachments
              </label>

              {/* Upload zone */}
              {watchedPhotos.length < 5 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground/60" />
                  <p className="mt-2 text-sm font-medium text-foreground">
                    Click or drag photos to upload
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Up to 5 high-resolution photos (JPEG, PNG, max 5MB each)
                  </p>
                </div>
              )}

              {errors.photos && typeof errors.photos.message === "string" && (
                <p className="mt-1 text-xs text-destructive">{errors.photos.message}</p>
              )}

              {/* Preview list */}
              {photoPreviews.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {photoPreviews.map((url, idx) => (
                    <div key={url} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        className="h-20 w-20 rounded-lg border border-border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                        aria-label={`Remove photo ${idx + 1}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button
              type="submit"
              disabled={coveringLoading || photoFiles.length === 0}
            >
              Review <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
