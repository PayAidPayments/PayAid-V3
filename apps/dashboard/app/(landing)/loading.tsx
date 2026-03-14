/**
 * Shown immediately while the landing page chunk loads.
 * Keeps first paint fast and avoids long blank screen.
 */
export default function LandingLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="flex flex-col items-center gap-4">
        <div className="h-9 w-9 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  )
}
