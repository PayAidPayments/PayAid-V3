'use client'

export function DashboardSkeleton() {
  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 py-6">
        <div className="h-7 w-56 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="mt-2 h-4 w-40 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
      <div className="px-6 py-6 space-y-5 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[104px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
        <div className="h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse" />
        <div className="h-10 w-80 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-72 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse" />
      </div>
    </div>
  )
}
