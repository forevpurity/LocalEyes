import { LayoutDashboard, FileText, Building2, Tags, Users, UserCircle, BarChart3, Shield, LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "@/features/auth/auth-context";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/departments", label: "Departments", icon: Building2 },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/staff", label: "Staff", icon: Users },
  { to: "/citizens", label: "Citizens", icon: UserCircle },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 px-4 py-5">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-label-md font-bold tracking-wide text-foreground">
            Admin Panel
          </span>
        </div>

        <nav className="flex-1 px-3 py-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={false}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-border px-4 py-3">
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.displayName}
                </p>
                <p className="text-label-sm capitalize text-muted-foreground">
                  {user.role}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}
