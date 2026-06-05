import { Link } from "react-router";
import { Bell, LogOut } from "lucide-react";
import { CivicShield } from "@/components/civic-shield";
import { useAuth } from "@/features/auth/auth-context";

export function Navbar() {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  // Admin has a completely different layout; don't render this navbar for them
  if (isAdmin) return null;

  return (
    <header className="bg-surface border-b border-outline-variant shadow-sm docked full-width top-0 sticky z-50 transition-all duration-300">
      <div className="flex justify-between items-center max-w-[1120px] mx-auto px-4 md:px-12 h-[72px]">
        {/* Logo */}
        <Link
          to="/"
          className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2"
        >
          <CivicShield className="w-8 h-8" />
          LocalEyes
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex gap-6 items-center">
          {isAuthenticated ? (
            <>
              <Link
                to="/map"
                className="font-label-md text-label-md text-primary border-b-2 border-primary pb-1 hover:text-primary transition-colors duration-200"
              >
                Map
              </Link>
              <Link
                to="/reports"
                className="font-label-md text-label-md text-on-surface-variant font-medium hover:text-primary transition-colors duration-200"
              >
                Reports
              </Link>
            </>
          ) : (
            <>
              <a
                className="font-label-md text-label-md text-on-surface-variant font-medium hover:text-primary transition-colors duration-200"
                href="#how-it-works"
              >
                How it Works
              </a>
              <Link
                to="/map"
                className="font-label-md text-label-md text-primary border-b-2 border-primary pb-1 hover:text-primary transition-colors duration-200"
              >
                Explore Map
              </Link>
            </>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <button
                className="relative rounded-lg p-2 text-on-surface-variant hover:text-primary transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {/* Notification dot placeholder */}
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="hidden text-sm text-on-surface-variant md:inline">
                  {user.displayName}
                </span>
                <button
                  onClick={() => logout()}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200 px-4 py-2"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="font-label-md text-label-md bg-primary text-primary-foreground rounded-lg px-4 py-2 h-[40px] hover:bg-primary/90 transition-colors duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
