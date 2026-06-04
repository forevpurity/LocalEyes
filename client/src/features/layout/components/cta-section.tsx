import { Link } from "react-router";

export function CtaSection() {
  return (
    <section className="py-16 md:py-[120px] bg-surface-container text-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-transparent to-surface-container-high z-0"></div>
      <div className="max-w-[800px] mx-auto flex flex-col gap-10 items-center relative z-10">
        <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground mb-3 shadow-xl shadow-primary/20">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48 }}
          >
            campaign
          </span>
        </div>
        <h2 className="font-display-lg text-display-lg md:text-[48px] md:leading-[56px] font-bold text-on-surface">
          Your voice matters.
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Let's improve our city together. Join thousands of citizens making a
          difference every day.
        </p>
        <Link to="/register">
          <button className="bg-primary text-primary-foreground font-label-md text-label-md h-[56px] px-8 rounded-xl mt-3 hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
            Join the Community
          </button>
        </Link>
      </div>
    </section>
  );
}
