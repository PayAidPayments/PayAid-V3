/**
 * Next.js instrumentation - runs once when the server starts.
 * Used for server-only initialization so app/layout stays light and avoids chunk timeouts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Phase 1: Validate critical env (log missing REDIS/DATABASE/JWT)
    import('@/lib/config/env').then(({ validateEnv }) => {
      validateEnv()
    }).catch(() => {})
    // Auto-initialize AI Influencer (don't block server ready)
    import('@/lib/ai-influencer/auto-init').catch((err) => {
      console.error('Instrumentation: AI Influencer auto-init failed', err)
    })
    // Auto-initialize background jobs (don't block server ready)
    import('@/lib/jobs/auto-init').catch((err) => {
      console.error('Instrumentation: Jobs auto-init failed', err)
    })
  }
}
