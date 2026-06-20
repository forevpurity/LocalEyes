import { useEffect } from "react";
import { useLocation } from "react-router";
import { Navbar } from "./components/navbar";
import { HeroSection } from "./components/hero-section";
import { HowItWorks } from "./components/how-it-works";
import { ImpactStats } from "./components/impact-stats";
import { ActivityFeed } from "./components/activity-feed";
import { CtaSection } from "./components/cta-section";
import { Footer } from "./components/footer";

export function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== "#how-it-works") return;

    const timeoutId = window.setTimeout(() => {
      document
        .getElementById("how-it-works")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <ImpactStats />
        <ActivityFeed />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
