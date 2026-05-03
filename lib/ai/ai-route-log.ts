/**
 * Minimal structured logs for Marketing AI HTTP routes (latency + outcome).
 * Parse JSON lines in log drains or grep `evt":"ai_route"`.
 */

export function aiRouteTimer(route: string) {
  const t0 = Date.now()
  return {
    success() {
      console.log(
        JSON.stringify({
          evt: 'ai_route',
          route,
          ms: Date.now() - t0,
          ok: true,
        })
      )
    },
    failure(err: unknown) {
      console.warn(
        JSON.stringify({
          evt: 'ai_route',
          route,
          ms: Date.now() - t0,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        })
      )
    },
  }
}
