import { useAuth } from "@/features/auth/use-auth";
import { LocalEyesMark } from "@/components/localeyes-mark";
import { ForcePasswordChangePage } from "@/features/auth/force-password-change-page";
import { PublicRoutes } from "./public-routes";
import { CitizenRoutes } from "./citizen-routes";
import { StaffRoutes } from "./staff-routes";
import { AdminRoutes } from "./admin-routes";

export function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LocalEyesMark className="w-12 h-12 animate-pulse" />
      </div>
    );
  }

  if (!user) return <PublicRoutes />;

  if (user.mustChangePassword) return <ForcePasswordChangePage />;

  switch (user.role) {
    case "admin":
      return <AdminRoutes />;
    case "staff":
      return <StaffRoutes />;
    default:
      return <CitizenRoutes />;
  }
}
