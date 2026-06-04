import { Navbar } from "./components/navbar";
import { HeroSection } from "./components/hero-section";
import { HowItWorks } from "./components/how-it-works";
import { ImpactStats } from "./components/impact-stats";
import { ActivityFeed } from "./components/activity-feed";
import { CtaSection } from "./components/cta-section";
import { Footer } from "./components/footer";

export function LandingPage() {
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
