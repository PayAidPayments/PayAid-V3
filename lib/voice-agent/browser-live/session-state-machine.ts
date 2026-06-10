/**
 * Browser live voice — session phase state machine (transport-agnostic).
 */

import type { BrowserLiveSessionPhase } from './protocol'

export type BrowserLiveStateMachineCallbacks = {
  onPhaseChange?: (phase: BrowserLiveSessionPhase, prev: BrowserLiveSessionPhase) => void
}

export class BrowserLiveSessionStateMachine {
  private phase: BrowserLiveSessionPhase = 'idle'
  private activeTurnId: string | null = null

  constructor(private callbacks: BrowserLiveStateMachineCallbacks = {}) {}

  getPhase(): BrowserLiveSessionPhase {
    return this.phase
  }

  getActiveTurnId(): string | null {
    return this.activeTurnId
  }

  private setPhase(next: BrowserLiveSessionPhase) {
    const prev = this.phase
    if (prev === next) return
    this.phase = next
    this.callbacks.onPhaseChange?.(next, prev)
  }

  connect() {
    if (this.phase === 'idle' || this.phase === 'error') {
      this.setPhase('connecting')
    }
  }

  onSessionReady() {
    this.setPhase('listening')
  }

  onSpeechStarted(): boolean {
    if (this.phase === 'speaking' || this.phase === 'thinking') {
      return true
    }
    return false
  }

  onInterrupt() {
    this.activeTurnId = null
    this.setPhase('listening')
  }

  beginTurn(turnId: string) {
    this.activeTurnId = turnId
    this.setPhase('thinking')
  }

  onAgentText(turnId: string) {
    if (this.activeTurnId === turnId && this.phase === 'thinking') {
      this.setPhase('speaking')
    }
  }

  onTurnComplete(turnId: string) {
    if (this.activeTurnId === turnId) {
      this.activeTurnId = null
    }
    if (this.phase === 'speaking' || this.phase === 'thinking') {
      this.setPhase('listening')
    }
  }

  onTurnCancelled(turnId: string) {
    if (this.activeTurnId === turnId) {
      this.activeTurnId = null
    }
    this.setPhase('listening')
  }

  /** Watchdog / disconnect recovery — never leave UI stuck in thinking/speaking. */
  forceListening() {
    this.activeTurnId = null
    this.setPhase('listening')
  }

  onError() {
    this.activeTurnId = null
    this.setPhase('error')
  }

  reset() {
    this.activeTurnId = null
    this.setPhase('idle')
  }
}
