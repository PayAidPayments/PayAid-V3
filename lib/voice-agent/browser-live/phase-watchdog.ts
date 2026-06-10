/**
 * Prevents stuck THINKING/SPEAKING when server hangs or disconnects.
 */

import type { BrowserLiveSessionPhase } from './protocol'

export type PhaseWatchdogOptions = {
  thinkingTimeoutMs?: number
  speakingTimeoutMs?: number
  onStuck: (phase: BrowserLiveSessionPhase, activeTurnId: string | null) => void
}

export class PhaseWatchdog {
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(private opts: PhaseWatchdogOptions) {}

  arm(phase: BrowserLiveSessionPhase, activeTurnId: string | null) {
    this.clear()
    const ms =
      phase === 'thinking'
        ? this.opts.thinkingTimeoutMs ?? 45_000
        : phase === 'speaking'
          ? this.opts.speakingTimeoutMs ?? 120_000
          : 0
    if (!ms) return
    this.timer = setTimeout(() => {
      this.opts.onStuck(phase, activeTurnId)
    }, ms)
  }

  clear() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}
