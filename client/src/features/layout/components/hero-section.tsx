import { Link } from "react-router";
import heroMap from "@/assets/hero-map.png";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-outline-variant/50 bg-linear-to-br from-surface-container-low via-surface-container to-surface-container-high pt-[80px] pb-[80px] md:pt-[140px] md:pb-[140px] dark:from-[#11141d] dark:via-[#171b25] dark:to-[#1d2230]">
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #001848 1px, transparent 1px), linear-gradient(to bottom, #001848 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-b from-transparent to-background/65 pointer-events-none dark:to-[#0f121a]" />
      <div className="max-w-[1120px] mx-auto px-4 md:px-12 grid md:grid-cols-2 gap-16 items-center relative z-10">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <h1 className="font-display-lg text-display-lg md:text-[64px] md:leading-[72px] text-on-surface font-bold tracking-tight">
              Build a Better HCM City{" "}
              <span className="text-primary">Together.</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
              Report civic issues like potholes, broken streetlights, or graffiti
              in seconds and track their resolution in real-time.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/login?redirect=/reports/new"
              className="bg-primary text-primary-foreground font-label-md text-label-md h-[48px] px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Report an Issue
            </Link>
            <Link
              to="/map"
              className="bg-surface text-primary border border-outline-variant font-label-md text-label-md h-[48px] px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container hover:border-primary transition-all shadow-sm"
            >
              <span className="material-symbols-outlined">map</span>
              View the Map
            </Link>
          </div>
        </div>
        <div className="relative hidden md:block">
          <div className="absolute inset-0 rounded-2xl bg-primary/18 blur-2xl opacity-70 translate-y-4 translate-x-4 dark:bg-primary/10 dark:opacity-45" />
          <img
            alt="Ho Chi Minh City Map UI"
            className="relative w-full h-auto rounded-2xl shadow-xl border border-white/40 object-cover aspect-4/3 ring-1 ring-black/5"
            src={heroMap}
          />
        </div>
      </div>
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] rounded-full bg-primary/14 blur-3xl opacity-75 z-0 pointer-events-none dark:bg-primary/8 dark:opacity-35" />
    </section>
  );
}
