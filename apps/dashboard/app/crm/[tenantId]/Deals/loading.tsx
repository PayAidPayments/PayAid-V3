/**
 * Shown during route transitions to Deals so the shell does not feel frozen
 * while the large client page chunk loads (especially in dev / Turbopack).
 */
export default function DealsRouteLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 p-4 sm:p-6 animate-pulse" aria-busy aria-label="Loading deals">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-40 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-72 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-52 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-10 w-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </div>
  )
}
