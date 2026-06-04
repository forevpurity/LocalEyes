export function ImpactStats() {
  return (
    <section className="py-16 md:py-[100px] bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50"></div>
      <div className="max-w-[1120px] mx-auto px-4 md:px-12 relative z-10">
        <div className="grid sm:grid-cols-3 gap-6 lg:gap-10">
          <div className="flex flex-col gap-1 py-10 px-6 bg-white/10 border border-white/20 rounded-2xl shadow-lg backdrop-blur-sm text-center transform transition-transform hover:scale-105">
            <span className="font-display-lg text-display-lg font-bold">15,420</span>
            <span className="font-label-md text-label-md text-primary-fixed-dim uppercase tracking-wider">Reports Resolved</span>
          </div>
          <div className="flex flex-col gap-1 py-10 px-6 bg-white/10 border border-white/20 rounded-2xl shadow-lg backdrop-blur-sm text-center transform transition-transform hover:scale-105">
            <span className="font-display-lg text-display-lg font-bold">24hr</span>
            <span className="font-label-md text-label-md text-primary-fixed-dim uppercase tracking-wider">Avg Response Time</span>
          </div>
          <div className="flex flex-col gap-1 py-10 px-6 bg-white/10 border border-white/20 rounded-2xl shadow-lg backdrop-blur-sm text-center transform transition-transform hover:scale-105">
            <span className="font-display-lg text-display-lg font-bold">85</span>
            <span className="font-label-md text-label-md text-primary-fixed-dim uppercase tracking-wider">Neighborhoods Covered</span>
          </div>
        </div>
      </div>
    </section>
  );
}
