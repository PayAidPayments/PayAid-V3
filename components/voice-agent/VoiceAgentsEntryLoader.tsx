'use client'

/** Minimal full-screen loader for /voice-agents entry (avoids dashboard PageLoading chunk). */
export function VoiceAgentsEntryLoader({ message = 'Loading Voice Agents...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-purple-600 dark:border-slate-600 dark:border-t-purple-400" />
      <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
    </div>
  )
}
