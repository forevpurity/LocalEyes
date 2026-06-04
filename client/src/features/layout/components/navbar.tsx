import { Link } from "react-router";
import { CivicShield } from "@/components/civic-shield";

export function Navbar() {
  return (
    <header className="bg-surface border-b border-outline-variant shadow-sm docked full-width top-0 sticky z-50 transition-all duration-300">
      <div className="flex justify-between items-center max-w-[1120px] mx-auto px-4 md:px-12 h-[72px]">
        <Link
          to="/"
          className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2"
        >
          <CivicShield className="w-8 h-8" />
          LocalEyes
        </Link>

        <nav className="hidden md:flex gap-6 items-center">
          <a
            className="font-label-md text-label-md text-primary border-b-2 border-primary pb-1 hover:text-primary transition-colors duration-200"
            href="#how-it-works"
          >
            How it Works
          </a>
          <Link
            to="/map"
            className="font-label-md text-label-md text-on-surface-variant font-medium hover:text-primary transition-colors duration-200"
          >
            Explore Map
          </Link>
        </nav>

        <div className="flex items-center gap-3">
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
        </div>
      </div>
    </header>
  );
}
