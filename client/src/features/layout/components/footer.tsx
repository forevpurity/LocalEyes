import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-surface border-t border-outline-variant full-width bottom-0">
      <div className="max-w-[1120px] mx-auto px-12 py-10 flex flex-col md:flex-row justify-between gap-6 items-center md:items-start">
        <div className="flex flex-col gap-3 items-center md:items-start text-center md:text-left">
          <Link
            to="/"
            className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              location_on
            </span>
            LocalEyes
          </Link>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
            &copy; 2024 LocalEyes Ho Chi Minh City. Dedicated to transparent civic progress.
          </p>
        </div>
        <nav className="flex flex-wrap justify-center md:justify-end gap-6 md:gap-10 mt-6 md:mt-0">
          <a
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200"
            href="#"
          >
            About Us
          </a>
          <a
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200"
            href="#"
          >
            Terms of Service
          </a>
          <a
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200"
            href="#"
          >
            Privacy Policy
          </a>
          <a
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200"
            href="#"
          >
            Contact Support
          </a>
          <a
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200"
            href="#"
          >
            City Council Portal
          </a>
        </nav>
      </div>
    </footer>
  );
}
