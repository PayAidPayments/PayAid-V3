/**
 * Shown while /home or /home/[tenantId] is loading (compile + client).
 * Keeps navigation from feeling stuck after login.
 */
export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading your dashboard...</p>
      </div>
    </div>
  )
}
