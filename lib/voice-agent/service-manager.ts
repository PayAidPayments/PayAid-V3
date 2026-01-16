/**
 * Service Manager with Failover
 * FREE implementation - only uses free services (Whisper, Coqui, Ollama)
 * 
 * Provides health checking, circuit breakers, and automatic failover
 * for STT, LLM, and TTS services
 */

export type ServiceType = 'stt' | 'llm' | 'tts'

export interface ServiceHealth {
  provider: string
  healthy: boolean
  lastCheck: Date
  failures: number
  state: 'healthy' | 'degraded' | 'unhealthy'
}

/**
 * Circuit Breaker for service health tracking
 */
class CircuitBreaker {
  private failures: number = 0
  private lastFailureTime: number = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private readonly failureThreshold: number = 5
  private readonly timeout: number = 60000 // 1 minute

  recordFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()
    if (this.failures >= this.failureThreshold) {
      this.state = 'open'
      console.warn(`[CircuitBreaker] Service marked as OPEN after ${this.failures} failures`)
    }
  }

  recordSuccess(): void {
    this.failures = 0
    this.state = 'closed'
  }

  isOpen(): boolean {
    if (this.state === 'open') {
      // Check if timeout has passed - move to half-open
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open'
        console.log('[CircuitBreaker] Service moved to HALF-OPEN state')
        return false // Allow one attempt
      }
      return true
    }
    return false
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state
  }

  getFailures(): number {
    return this.failures
  }
}

/**
 * Service Manager for FREE services only
 */
export class ServiceManager {
  // FREE service providers only
  private providers = {
    stt: ['whisper'], // Whisper (local)
    llm: ['ollama'], // Ollama (local)
    tts: ['coqui', 'indicparler'], // Coqui XTTS v2 (local), IndicParler (local)
  }

  private healthStatus: Map<string, ServiceHealth> = new Map()
  private circuitBreakers: Map<string, CircuitBreaker> = new Map()

  constructor() {
    // Initialize circuit breakers for all providers
    Object.values(this.providers).flat().forEach(provider => {
      this.circuitBreakers.set(provider, new CircuitBreaker())
      this.healthStatus.set(provider, {
        provider,
        healthy: true,
        lastCheck: new Date(),
        failures: 0,
        state: 'healthy',
      })
    })
  }

  /**
   * Get a healthy service provider
   * @param type - Service type (stt, llm, tts)
   * @param preferred - Preferred provider (optional)
   * @returns Provider name
   */
  async getService(type: ServiceType, preferred?: string): Promise<string> {
    const availableProviders = this.providers[type]
    
    if (!availableProviders || availableProviders.length === 0) {
      throw new Error(`No providers available for ${type}`)
    }

    // Try preferred provider first if specified
    if (preferred && availableProviders.includes(preferred)) {
      if (await this.isHealthy(preferred)) {
        return preferred
      }
      console.warn(`[ServiceManager] Preferred provider ${preferred} is unhealthy, trying alternatives`)
    }

    // Try all providers in order
    for (const provider of availableProviders) {
      if (await this.isHealthy(provider)) {
        return provider
      }
    }

    // All providers unhealthy - return first one anyway (let caller handle error)
    console.error(`[ServiceManager] All ${type} providers are unhealthy, using ${availableProviders[0]} as fallback`)
    return availableProviders[0]
  }

  /**
   * Check if a provider is healthy
   */
  private async isHealthy(provider: string): Promise<boolean> {
    const breaker = this.circuitBreakers.get(provider)
    if (!breaker) {
      return false
    }

    // Check circuit breaker
    if (breaker.isOpen()) {
      const health = this.healthStatus.get(provider)
      if (health) {
        health.state = 'unhealthy'
        health.healthy = false
      }
      return false
    }

    // Perform health check
    try {
      const healthy = await this.performHealthCheck(provider)
      
      const health: ServiceHealth = {
        provider,
        healthy,
        lastCheck: new Date(),
        failures: breaker.getFailures(),
        state: healthy ? 'healthy' : breaker.getFailures() > 2 ? 'degraded' : 'healthy',
      }
      
      this.healthStatus.set(provider, health)

      if (healthy) {
        breaker.recordSuccess()
      } else {
        breaker.recordFailure()
      }

      return healthy
    } catch (error) {
      console.error(`[ServiceManager] Health check failed for ${provider}:`, error)
      breaker.recordFailure()
      
      const health = this.healthStatus.get(provider)
      if (health) {
        health.healthy = false
        health.state = 'unhealthy'
        health.failures = breaker.getFailures()
      }
      
      return false
    }
  }

  /**
   * Perform actual health check for a provider
   */
  private async performHealthCheck(provider: string): Promise<boolean> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000) // 2 second timeout

    try {
      switch (provider) {
        case 'whisper':
          // Check Whisper STT service (via AI Gateway)
          const sttUrl = process.env.AI_GATEWAY_URL || 'http://localhost:8000'
          const sttResponse = await fetch(`${sttUrl}/health`, {
            signal: controller.signal,
            method: 'GET',
          })
          return sttResponse.ok

        case 'ollama':
          // Check Ollama LLM service
          const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
          const ollamaResponse = await fetch(`${ollamaUrl}/api/tags`, {
            signal: controller.signal,
            method: 'GET',
          })
          return ollamaResponse.ok

        case 'coqui':
        case 'indicparler':
          // Check TTS service (via AI Gateway)
          const ttsUrl = process.env.AI_GATEWAY_URL || 'http://localhost:8000'
          const ttsResponse = await fetch(`${ttsUrl}/health`, {
            signal: controller.signal,
            method: 'GET',
          })
          return ttsResponse.ok

        default:
          return false
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(`[ServiceManager] Health check timeout for ${provider}`)
      }
      return false
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Get health status for all providers
   */
  getHealthStatus(): Map<string, ServiceHealth> {
    return new Map(this.healthStatus)
  }

  /**
   * Get health status for a specific provider
   */
  getProviderHealth(provider: string): ServiceHealth | undefined {
    return this.healthStatus.get(provider)
  }

  /**
   * Manually mark a provider as healthy (for recovery)
   */
  markHealthy(provider: string): void {
    const breaker = this.circuitBreakers.get(provider)
    if (breaker) {
      breaker.recordSuccess()
    }
    
    const health = this.healthStatus.get(provider)
    if (health) {
      health.healthy = true
      health.state = 'healthy'
      health.failures = 0
      health.lastCheck = new Date()
    }
  }

  /**
   * Record a service failure
   */
  recordFailure(provider: string): void {
    const breaker = this.circuitBreakers.get(provider)
    if (breaker) {
      breaker.recordFailure()
    }
    
    const health = this.healthStatus.get(provider)
    if (health) {
      health.failures = breaker?.getFailures() || 0
      health.state = health.failures >= 5 ? 'unhealthy' : 'degraded'
      health.healthy = health.failures < 3
    }
  }

  /**
   * Record a service success
   */
  recordSuccess(provider: string): void {
    const breaker = this.circuitBreakers.get(provider)
    if (breaker) {
      breaker.recordSuccess()
    }
    
    const health = this.healthStatus.get(provider)
    if (health) {
      health.healthy = true
      health.state = 'healthy'
      health.failures = 0
      health.lastCheck = new Date()
    }
  }
}

// Singleton instance
let serviceManagerInstance: ServiceManager | null = null

/**
 * Get Service Manager singleton
 */
export function getServiceManager(): ServiceManager {
  if (!serviceManagerInstance) {
    serviceManagerInstance = new ServiceManager()
  }
  return serviceManagerInstance
}
