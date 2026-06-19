import { useState, useRef, useEffect } from "react";
import { Link, NavLink } from "react-router";
import { LogOut, Menu, User, X } from "lucide-react";
import { CivicShield } from "@/components/civic-shield";
import { useAuth } from "@/features/auth/use-auth";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { ThemeToggle } from "@/features/theme/theme-toggle";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? "font-label-md text-label-md text-primary border-b-2 border-primary pb-1 hover:text-primary transition-colors duration-200"
    : "font-label-md text-label-md text-on-surface-variant font-medium hover:text-primary transition-colors duration-200";

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? "rounded-lg bg-primary/10 px-3 py-2 font-label-md text-label-md font-medium text-primary"
    : "rounded-lg px-3 py-2 font-label-md text-label-md font-medium text-on-surface-variant hover:bg-muted hover:text-primary transition-colors";

export function Navbar() {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [userMenuOpen]);

  // Admin has a completely different layout; don't render this navbar for them
  if (isAdmin) return null;

  const closeMobile = () => setMobileOpen(false);

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
              <NavLink to="/map" className={navLinkClass}>
                Map
              </NavLink>
              <NavLink to="/reports" className={navLinkClass}>
                Reports
              </NavLink>
            </>
          ) : (
            <>
              <a
                className="font-label-md text-label-md text-on-surface-variant font-medium hover:text-primary transition-colors duration-200"
                href="#how-it-works"
              >
                How it Works
              </a>
              <NavLink to="/map" className={navLinkClass}>
                Explore Map
              </NavLink>
            </>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <div className="hidden h-6 w-px bg-border md:block" />
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
                  aria-haspopup="true"
                  aria-expanded={userMenuOpen}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary text-label-sm font-label-sm select-none">
                    {user.displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm text-on-surface-variant max-w-[120px] truncate">
                    {user.displayName}
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-44 rounded-lg border border-outline-variant bg-surface-container-lowest shadow-md py-1 z-50">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-muted transition-colors"
                    >
                      <User className="h-4 w-4 text-on-surface-variant" />
                      Profile
                    </Link>
                    <div className="my-1 h-px bg-outline-variant" />
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-muted hover:text-destructive transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200 px-4 py-2 md:inline-flex"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="hidden font-label-md text-label-md bg-primary text-primary-foreground rounded-lg px-4 py-2 h-[40px] hover:bg-primary/90 transition-colors duration-200 md:flex items-center justify-center shadow-sm hover:shadow-md"
              >
                Register
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-lg p-2 text-on-surface-variant hover:bg-muted hover:text-primary transition-colors md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-outline-variant px-4 py-3 md:hidden">
          {isAuthenticated ? (
            <>
              <NavLink to="/map" className={mobileLinkClass} onClick={closeMobile}>
                Map
              </NavLink>
              <NavLink
                to="/reports"
                className={mobileLinkClass}
                onClick={closeMobile}
              >
                Reports
              </NavLink>
              <NavLink
                to="/profile"
                className={mobileLinkClass}
                onClick={closeMobile}
              >
                Profile
              </NavLink>
              <div className="my-1 h-px bg-outline-variant" />
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-on-surface-variant">
                  {user.displayName}
                </span>
                <button
                  onClick={() => {
                    closeMobile();
                    logout();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <a
                href="#how-it-works"
                className="rounded-lg px-3 py-2 font-label-md text-label-md font-medium text-on-surface-variant hover:bg-muted hover:text-primary transition-colors"
                onClick={closeMobile}
              >
                How it Works
              </a>
              <NavLink to="/map" className={mobileLinkClass} onClick={closeMobile}>
                Explore Map
              </NavLink>
              <div className="my-1 h-px bg-outline-variant" />
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 font-label-md text-label-md font-medium text-on-surface-variant hover:bg-muted hover:text-primary transition-colors"
                onClick={closeMobile}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-primary px-3 py-2 text-center font-label-md text-label-md font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                onClick={closeMobile}
              >
                Register
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
