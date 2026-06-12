import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, ImageIcon, X } from "lucide-react";
import type { ReportPhoto } from "@/types/api";
import { cn } from "@/lib/utils";

export function ReportPhotoGallery({ photos }: { photos: ReportPhoto[] }) {
  const ordered = [...photos].sort((a, b) => a.order - b.order);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (ordered.length === 0) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted text-muted-foreground">
        <ImageIcon className="h-8 w-8" aria-hidden="true" />
        <span className="text-xs font-medium uppercase">No photo attached</span>
      </div>
    );
  }

  const active = Math.min(activeIndex, ordered.length - 1);
  const go = (delta: number) =>
    setActiveIndex((i) => (i + delta + ordered.length) % ordered.length);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="block w-full overflow-hidden rounded-lg bg-muted"
        aria-label="Open photo in full screen"
      >
        <img
          src={ordered[active].url}
          alt=""
          className="h-72 w-full object-cover transition-opacity md:h-80"
        />
      </button>

      {ordered.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {ordered.map((photo, i) => (
            <button
              key={photo.url}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "h-14 w-14 overflow-hidden rounded-md bg-muted ring-offset-2 ring-offset-card transition-all sm:h-16 sm:w-16",
                i === active
                  ? "ring-2 ring-primary"
                  : "opacity-70 hover:opacity-100",
              )}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === active}
            >
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
          <Dialog.Popup
            className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none"
            onKeyDown={(e) => {
              if (ordered.length < 2) return;
              if (e.key === "ArrowLeft") go(-1);
              if (e.key === "ArrowRight") go(1);
            }}
          >
            <Dialog.Title className="sr-only">Report photo</Dialog.Title>

            <Dialog.Close
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>

            <img
              src={ordered[active].url}
              alt=""
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            />

            {ordered.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
                  {active + 1} / {ordered.length}
                </div>
              </>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
