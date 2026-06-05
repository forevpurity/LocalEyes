import { useAuth } from "@/features/auth/auth-context";
import { CivicShield } from "@/components/civic-shield";
import { PublicRoutes } from "./public-routes";
import { CitizenRoutes } from "./citizen-routes";
import { StaffRoutes } from "./staff-routes";
import { AdminRoutes } from "./admin-routes";

export function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CivicShield className="w-12 h-12 animate-pulse" />
      </div>
    );
  }

  if (!user) return <PublicRoutes />;

  switch (user.role) {
    case "admin":
      return <AdminRoutes />;
    case "staff":
      return <StaffRoutes />;
    default:
      return <CitizenRoutes />;
  }
}
