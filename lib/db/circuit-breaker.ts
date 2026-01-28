/**
 * Circuit Breaker Pattern for Database Operations
 * 
 * Prevents cascading failures when database is overloaded
 * Opens circuit after consecutive failures, closes after recovery
 */

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failures: number
  lastFailureTime: number | null
  successCount: number
}

const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5, // Open circuit after 5 consecutive failures
  successThreshold: 2, // Close circuit after 2 consecutive successes
  timeout: 30000, // 30 seconds before attempting to close circuit
  resetTimeout: 60000, // 1 minute before resetting failure count
}

class CircuitBreaker {
  private state: CircuitBreakerState = {
    state: 'CLOSED',
    failures: 0,
    lastFailureTime: null,
    successCount: 0,
  }

  /**
   * Check if circuit is open (should reject requests)
   */
  isOpen(): boolean {
    const { state, failures, lastFailureTime } = this.state

    if (state === 'OPEN') {
      // Check if timeout has passed to allow half-open state
      if (lastFailureTime && Date.now() - lastFailureTime > CIRCUIT_BREAKER_CONFIG.timeout) {
        this.state.state = 'HALF_OPEN'
        this.state.successCount = 0
        return false // Allow one request through
      }
      return true // Circuit is open, reject requests
    }

    if (state === 'HALF_OPEN') {
      return false // Allow requests through to test recovery
    }

    // CLOSED state - check if we've exceeded failure threshold
    if (failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
      this.state.state = 'OPEN'
      this.state.lastFailureTime = Date.now()
      console.error('[CIRCUIT_BREAKER] Circuit opened due to too many failures', {
        failures,
        threshold: CIRCUIT_BREAKER_CONFIG.failureThreshold,
      })
      return true
    }

    return false
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    const { state, successCount } = this.state

    if (state === 'HALF_OPEN') {
      this.state.successCount++
      if (successCount >= CIRCUIT_BREAKER_CONFIG.successThreshold) {
        // Circuit recovered, close it
        this.state.state = 'CLOSED'
        this.state.failures = 0
        this.state.lastFailureTime = null
        this.state.successCount = 0
        console.log('[CIRCUIT_BREAKER] Circuit closed - database recovered')
      }
    } else if (state === 'CLOSED') {
      // Reset failure count on success
      this.state.failures = 0
      this.state.lastFailureTime = null
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure(): void {
    this.state.failures++
    this.state.lastFailureTime = Date.now()
    this.state.successCount = 0

    if (this.state.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
      this.state.state = 'OPEN'
      console.error('[CIRCUIT_BREAKER] Circuit opened', {
        failures: this.state.failures,
        threshold: CIRCUIT_BREAKER_CONFIG.failureThreshold,
      })
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return { ...this.state }
  }

  /**
   * Reset circuit breaker (for testing or manual recovery)
   */
  reset(): void {
    this.state = {
      state: 'CLOSED',
      failures: 0,
      lastFailureTime: null,
      successCount: 0,
    }
  }
}

// Singleton instance
const circuitBreaker = new CircuitBreaker()

export { circuitBreaker, CircuitBreaker }
export type { CircuitBreakerState }
