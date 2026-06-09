import { useState } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "@/features/layout/components/navbar";
import { ReportLocationStep } from "@/features/reports/components/report-location-step";
import { ReportDetailsStep } from "@/features/reports/components/report-details-step";
import { ReviewStep } from "@/features/reports/components/review-step";
import { useCoveringDepartment } from "@/features/reports/hooks/use-covering-department";

const STEPS = [
  { id: 1, label: "Location" },
  { id: 2, label: "Details" },
  { id: 3, label: "Review" },
];

export function CreateReportPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address: string | null;
  } | null>(null);
  const [details, setDetails] = useState<{
    title: string;
    description: string;
    categoryId: string;
    photos: File[];
  } | null>(null);

  // Fetch covering department data once location is set
  const {
    data: covering,
    isLoading: coveringLoading,
    error: coveringError,
  } = useCoveringDepartment(
    location?.lat ?? undefined,
    location?.lng ?? undefined,
  );

  const handleLocationNext = (loc: {
    lat: number;
    lng: number;
    address: string | null;
  }) => {
    setLocation(loc);
    setStep(2);
  };

  const handleDetailsNext = (data: {
    title: string;
    description: string;
    categoryId: string;
    photos: File[];
  }) => {
    setDetails(data);
    setStep(3);
  };

  const handleBackToLocation = () => {
    setStep(1);
  };

  const handleBackToDetails = () => {
    setStep(2);
  };

  const handleSubmitSuccess = (reportId: string) => {
    navigate(`/reports/${reportId}`);
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-[calc(100vh-72px)] flex-col bg-muted/30">
        {/* Step indicator */}
        <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-6">
          <div className="flex items-center">
            {STEPS.map((s, index) => (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      s.id === step
                        ? "bg-primary text-primary-foreground"
                        : s.id < step
                          ? "bg-primary/20 text-primary"
                          : "border-2 border-muted-foreground/30 bg-background text-muted-foreground"
                    }`}
                  >
                    {s.id < step ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      s.id
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      s.id === step
                        ? "text-primary"
                        : s.id < step
                          ? "text-primary/70"
                          : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="mx-3 h-0.5 flex-1 bg-muted-foreground/20" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-8">
          {step === 1 && (
            <ReportLocationStep
              initialPin={location}
              onNext={handleLocationNext}
              onBack={() => navigate("/map")}
            />
          )}
          {step === 2 && location && (
            <ReportDetailsStep
              covering={covering}
              coveringLoading={coveringLoading}
              coveringError={coveringError}
              initialData={details ?? undefined}
              onNext={handleDetailsNext}
              onBack={handleBackToLocation}
            />
          )}
          {step === 3 && location && details && (
            <ReviewStep
              location={location}
              details={details}
              covering={covering}
              onBack={handleBackToDetails}
              onSuccess={handleSubmitSuccess}
            />
          )}
        </div>
      </div>
    </>
  );
}
