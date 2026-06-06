import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export function DepartmentCreatePage() {
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
        {/* Full-width map placeholder */}
        <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
          <div className="text-center">
            <p className="text-body-lg font-medium">Map placeholder</p>
            <p className="text-body-sm mt-1">
              Full-width map with polygon drawing will be implemented in Step 4
            </p>
          </div>
        </div>

        {/* Floating form card placeholder */}
        <div className="absolute right-6 top-6 w-80 rounded-lg border border-border bg-card p-4 shadow-lg">
          <p className="text-label-sm text-muted-foreground">
            Form placeholder — will be implemented in Step 4
          </p>
        </div>
      </div>
    </div>
  );
}
