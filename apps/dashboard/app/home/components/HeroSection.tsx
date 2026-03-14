'use client'

/** Subtle abstract dashboard/cards illustration for hero (SVG, no heavy assets). */
function HeroIllustration() {
  return (
    <div className="relative w-full h-full min-h-[180px] flex items-center justify-end">
      <svg
        viewBox="0 0 200 120"
        className="w-full max-w-[280px] h-auto text-slate-300 dark:text-slate-600"
        aria-hidden
      >
        <rect x="20" y="20" width="70" height="50" rx="8" fill="currentColor" opacity="0.4" />
        <rect x="95" y="10" width="85" height="55" rx="8" fill="currentColor" opacity="0.25" />
        <rect x="30" y="75" width="60" height="35" rx="6" fill="currentColor" opacity="0.2" />
        <rect x="100" y="70" width="75" height="40" rx="6" fill="currentColor" opacity="0.15" />
        <circle cx="55" cy="45" r="4" fill="currentColor" opacity="0.5" />
        <circle cx="140" cy="38" r="3" fill="currentColor" opacity="0.4" />
      </svg>
    </div>
  )
}

interface HeroSectionProps {
  businessName?: string
  userName?: string
}

export function HeroSection({ businessName, userName }: HeroSectionProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-8 lg:gap-12 items-center mb-10">
      <div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-gray-100 tracking-tight mb-2">
          All-in-One Business OS
        </h1>
        <p className="text-lg text-slate-600 dark:text-gray-400 mb-4 max-w-xl">
          Run CRM, finance, HR, and AI copilots from one place.
        </p>
        {businessName && (
          <p className="text-base font-medium text-slate-700 dark:text-gray-300 mb-1">
            {userName ? `${userName} · ` : ''}{businessName}
          </p>
        )}
        <p className="text-sm text-slate-500 dark:text-gray-400">
          Today at a glance — jump to your apps below.
        </p>
        <p className="text-xs text-slate-400 dark:text-gray-500 mt-2">
          Trusted by 500+ Indian businesses
        </p>
      </div>
      <div className="hidden lg:block flex-shrink-0">
        <HeroIllustration />
      </div>
    </section>
  )
}
