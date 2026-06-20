export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 py-16 md:py-[120px] bg-surface-bright relative z-20"
    >
      <div className="max-w-[1120px] mx-auto px-4 md:px-12 flex flex-col gap-16">
        <div className="text-center flex flex-col gap-3 max-w-2xl mx-auto">
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            How it Works
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Three simple steps to make an impact in your neighborhood.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-10">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center gap-6 p-10 bg-surface rounded-2xl shadow-sm border border-outline-variant/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-2 shadow-inner">
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 32,
                  fontVariationSettings: "'FILL' 1",
                }}
              >
                location_on
              </span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              1. Pin it
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Drop a pin on the interactive map to identify the exact location
              of the issue.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center gap-6 p-10 bg-surface rounded-2xl shadow-sm border border-outline-variant/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-2 shadow-inner">
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 32,
                  fontVariationSettings: "'FILL' 1",
                }}
              >
                description
              </span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              2. Describe it
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Provide details and upload a photo to help city officials
              understand the problem.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center gap-6 p-10 bg-surface rounded-2xl shadow-sm border border-outline-variant/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container mb-2 shadow-inner">
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 32,
                  fontVariationSettings: "'FILL' 1",
                }}
              >
                check_circle
              </span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              3. Track it
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Follow the progress of your report from submission to resolution
              in real-time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
