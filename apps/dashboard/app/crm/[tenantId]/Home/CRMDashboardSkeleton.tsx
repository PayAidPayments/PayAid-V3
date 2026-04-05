/** Shared CRM Home loading UI — used by route `loading.tsx` and the dashboard client chunk. */
export function CRMDashboardSkeleton() {
  return (
    <div className="w-full bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 relative transition-colors min-h-screen">
      <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 px-6 py-8 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-72 bg-white/20 rounded-lg animate-pulse" />
          <div className="mt-3 h-3 w-40 bg-white/20 rounded animate-pulse" />
          <div className="mt-4 h-1.5 w-56 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full w-1/3 bg-white/60 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse"
            />
          ))}
        </div>

        <div className="h-44 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse" />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="h-72 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse" />
          <div className="h-72 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-56 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse" />
          <div className="h-56 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse" />
          <div className="h-56 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse" />
        </div>
      </div>
    </div>
  )
}
