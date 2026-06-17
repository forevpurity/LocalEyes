import { useState, useRef, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useAddReportPhotos } from "@/features/reports/hooks/use-add-report-photos";
import { ApiRequestError } from "@/lib/api";
import { cn } from "@/lib/utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILES = 5;
const MAX_AFTER_PHOTOS = 10;

interface ResolutionPhotoUploadProps {
  reportId: string;
  afterPhotoCount?: number;
}

export function ResolutionPhotoUpload({ reportId, afterPhotoCount = 0 }: ResolutionPhotoUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useAddReportPhotos(reportId);

  // Object URLs are an external resource: create them on mount and revoke on
  // unmount. Deriving them via useMemo breaks under StrictMode, which runs the
  // cleanup once before the final commit and would leave us rendering already
  // revoked URLs.
  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing external object-URL lifecycle, not derived state
    setFileUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const remaining = Math.max(0, MAX_AFTER_PHOTOS - afterPhotoCount);
  const isFull = remaining === 0;

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => ALLOWED_TYPES.includes(f.type));
    if (valid.length !== files.length) {
      toast.error("Only JPEG, PNG, and WebP files are allowed.");
    }
    setSelectedFiles((prev) => {
      const combined = [...prev, ...valid];
      return combined.slice(0, Math.min(MAX_FILES, remaining));
    });
    // Reset input so re-selecting the same file triggers onChange
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;
    upload.mutate(selectedFiles, {
      onSuccess: () => {
        toast.success("Resolution photos uploaded.");
        setSelectedFiles([]);
      },
      onError: (err) => {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Couldn't upload photos.";
        toast.error(message);
      },
    });
  };

  return (
    <div className="space-y-3">
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, i) => (
              <div
                key={`${file.name}-${file.lastModified}`}
                className="relative h-16 w-16 overflow-hidden rounded-md bg-muted"
              >
                <img
                  src={fileUrls[i]}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute right-0.5 top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={upload.isPending}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {upload.isPending ? "Uploading…" : `Upload ${selectedFiles.length} photo${selectedFiles.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          onChange={handleSelect}
          className="hidden"
          id="resolution-photo-input"
        />
        <label
          htmlFor={isFull ? undefined : "resolution-photo-input"}
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors",
            isFull
              ? "cursor-not-allowed opacity-50"
              : "hover:border-primary/50 hover:text-primary",
            upload.isPending && "pointer-events-none opacity-50",
          )}
        >
          <Upload className="h-4 w-4" />
          {isFull
            ? `Maximum ${MAX_AFTER_PHOTOS} resolution photos`
            : `Add resolution photos (${remaining}/${MAX_AFTER_PHOTOS})`}
        </label>
      </div>
    </div>
  );
}
