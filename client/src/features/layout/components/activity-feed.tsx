import { Link } from "react-router";

export function ActivityFeed() {
  return (
    <section className="py-16 md:py-[120px] bg-surface">
      <div className="max-w-[1120px] mx-auto px-4 md:px-12 flex flex-col gap-16">
        <div className="flex flex-col sm:flex-row justify-between items-end gap-6 border-b border-outline-variant pb-6">
          <div className="flex flex-col gap-3">
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface flex items-center gap-3">
              Live Activity Feed
              <span className="relative flex h-3 w-3 mt-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
              </span>
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Recent reports submitted by citizens across the city.</p>
          </div>
          <Link
            to="/map"
            className="text-primary font-label-md text-label-md hover:text-primary/80 transition-colors flex items-center gap-1 group"
          >
            View All Reports <span className="material-symbols-outlined transform group-hover:translate-x-1 transition-transform" style={{ fontSize: "16px" }}>arrow_forward</span>
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {/* Card 1 */}
          <article className="bg-surface rounded-2xl shadow-sm border border-outline-variant/50 overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-outline-variant">
            <div className="h-[200px] bg-surface-container relative overflow-hidden group">
              <img
                alt="Pothole"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                data-alt="A close-up, high-quality photograph of a pothole on an urban asphalt street during daytime. The image has a slightly desaturated, documentary style common in civic reporting apps. The lighting is natural and flat, highlighting the texture of the broken pavement. The overall color palette is dominated by neutral grays and blacks, providing a realistic depiction of municipal infrastructure damage."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrVQYiqY9NLr9MxbHF56SySiiBUUTGOnwtaeVhtqYUQmYZPXphd0IOrHxfDH8tOckpKjWkpt05og10SCwPXBGW0yTcPJ6KbjvP06NobnmSHeXg_gV3QIqHW2c83RnZZkmkMqQJpfqjnOPVcwTEbznjz-vqPSjVXNjxKeDSwU5Q0QEQHd1O-nwNEIIW58L0ehGde7J4XJcAUNsOiWmS8Ci1N40VP92_oOLqxN-Mdp5ywXYR1tgfesAVzVNE26Kv0Efh453ZerrdffvW"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-3 right-3 bg-secondary text-on-secondary font-label-sm text-label-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md backdrop-blur-md bg-opacity-90">
                <span className="material-symbols-outlined" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Resolved
              </div>
            </div>
            <div className="p-10 flex flex-col gap-3 grow">
              <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1">Pothole on Le Loi St</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>schedule</span> 2 hours ago
              </p>
              <div className="mt-auto pt-6 border-t border-outline-variant/40 flex gap-6 text-outline">
                <div className="flex items-center gap-1 font-label-sm text-label-sm hover:text-primary transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>thumb_up</span> 24
                </div>
                <div className="flex items-center gap-1 font-label-sm text-label-sm hover:text-primary transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chat_bubble</span> 5
                </div>
              </div>
            </div>
          </article>
          {/* Card 2 */}
          <article className="bg-surface rounded-2xl shadow-sm border border-outline-variant/50 overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-outline-variant">
            <div className="h-[200px] bg-surface-container relative overflow-hidden group">
              <img
                alt="Streetlight"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                data-alt="A photograph of a broken, modern streetlight pole taken against a dusk sky. The image has a cool, slightly blue color cast, conveying an evening setting. The style is straightforward and informative, typical of a user-submitted photo in a reporting app. The scene highlights the need for maintenance in a residential or commercial district, fitting perfectly into a light-mode UI context."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8mlX1k9hJdOUvElNqOkata4AQ3JJ54-uZN_qMhHdzyf0Fa2IHmolcwvsx2g1nAOMdcBjBS2qDquzLNRcWy0JaqoFK8kVZBkeNiseYybF1XGH38PsHp55srJQYMv0kkBfcbdYkn1zz6wLdvovvWC8gFRqXbqlV3vTZAlcLVojm0g4NqYAoEyuemS52_W6Do33cNHlGwhmar-EErk8Gu8kAl4ISogcOgssMAeUWGeNwz8fN4Qwtcr4qCttIdd97VnlRpro3WlKmyimG"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-3 right-3 bg-primary-container text-on-primary-container font-label-sm text-label-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md backdrop-blur-md bg-opacity-90">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>sync</span>
                In Progress
              </div>
            </div>
            <div className="p-10 flex flex-col gap-3 grow">
              <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1">Broken Streetlight in District 7</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>schedule</span> 5 hours ago
              </p>
              <div className="mt-auto pt-6 border-t border-outline-variant/40 flex gap-6 text-outline">
                <div className="flex items-center gap-1 font-label-sm text-label-sm hover:text-primary transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>thumb_up</span> 12
                </div>
                <div className="flex items-center gap-1 font-label-sm text-label-sm hover:text-primary transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chat_bubble</span> 2
                </div>
              </div>
            </div>
          </article>
          {/* Card 3 */}
          <article className="bg-surface rounded-2xl shadow-sm border border-outline-variant/50 overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-outline-variant">
            <div className="h-[200px] bg-surface-container relative overflow-hidden group">
              <div className="absolute inset-0 flex items-center justify-center bg-surface-variant transition-transform duration-500 group-hover:scale-105">
                <span className="material-symbols-outlined text-outline/50" style={{ fontSize: "56px" }}>image</span>
              </div>
              <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-3 right-3 bg-surface text-on-surface-variant border border-outline-variant font-label-sm text-label-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md backdrop-blur-md bg-opacity-90">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>pending</span>
                Submitted
              </div>
            </div>
            <div className="p-10 flex flex-col gap-3 grow">
              <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1">Graffiti at Cong Vien Le Van Tam</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>schedule</span> 1 day ago
              </p>
              <div className="mt-auto pt-6 border-t border-outline-variant/40 flex gap-6 text-outline">
                <div className="flex items-center gap-1 font-label-sm text-label-sm hover:text-primary transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>thumb_up</span> 8
                </div>
                <div className="flex items-center gap-1 font-label-sm text-label-sm hover:text-primary transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chat_bubble</span> 0
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
