/**
 * Shown immediately while the route segment loads (App Router streaming).
 * Helps avoid a blank browser tab when `/` is still compiling a large client bundle.
 */
export default function RootLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div
        className="h-9 w-9 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin"
        aria-hidden
      />
      <p className="mt-4 text-sm text-slate-500">Loading PayAid…</p>
    </div>
  )
}
