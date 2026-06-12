import { Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";

interface CreateReportFabProps {
  /** Hide on mobile (e.g. while the report sheet is expanded over it). */
  hideOnMobile?: boolean;
}

export function CreateReportFab({ hideOnMobile = false }: CreateReportFabProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/reports/new")}
      className={cn(
        "absolute bottom-24 right-6 z-[1001] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-6 md:flex",
        hideOnMobile && "hidden",
      )}
      aria-label="Create new report"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
