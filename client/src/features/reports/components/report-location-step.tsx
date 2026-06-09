import { useState } from "react";
import { PinLocationStep } from "@/features/reports/components/pin-location-step";

interface ReportLocationStepProps {
  initialPin: { lat: number; lng: number; address: string | null } | null;
  onNext: (loc: { lat: number; lng: number; address: string | null }) => void;
  onBack: () => void;
}

export function ReportLocationStep({
  initialPin,
  onNext,
  onBack,
}: ReportLocationStepProps) {
  const [pinData, setPinData] = useState<{
    lat: number;
    lng: number;
    address: string | null;
  } | null>(initialPin);

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <button
            onClick={onBack}
            className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </button>
          <h2 className="text-xl font-semibold text-foreground">
            Pin Location
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap or drag the map to precisely mark where the issue was observed.
          </p>
        </div>

        <div className="py-4 px-0">
          <div className="relative overflow-hidden border border-border">
            <PinLocationStep initialPin={pinData} onPinChange={setPinData} />
          </div>
        </div>

        <div className="flex justify-end px-6 pb-6">
          <button
            onClick={() => pinData && onNext(pinData)}
            disabled={!pinData}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0 text-amber-700"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Why report?</span> Every issue
            submitted helps the City Council prioritize urban maintenance. Most
            reports are reviewed within 48 hours. Your data is protected by our
            Civic Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
