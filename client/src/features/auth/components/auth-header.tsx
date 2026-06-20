import { Link } from "react-router";
import { LocalEyesMark } from "@/components/localeyes-mark";

export function AuthHeader() {
  return (
    <header className="bg-surface shadow-sm fixed top-0 left-0 w-full z-50 flex justify-between items-center h-16 px-6 mx-auto">
      <div className="flex items-center gap-3">
        <LocalEyesMark className="w-8 h-8 text-primary" />
        <Link
          to="/"
          className="text-headline-sm font-headline-sm font-bold text-primary"
        >
          LocalEyes
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to="/"
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-label-md font-label-md"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Back To Home
        </Link>
      </div>
    </header>
  );
}
