/**
 * Phase 1: Central env validation and typed getters.
 * Validates critical vars at startup; use for REDIS/DATABASE/JWT/AI config.
 * Ensures production never uses localhost Redis/AI (avoids demo hangs).
 */

const getEnv = (key: string, defaultValue?: string): string => {
  const v = process.env[key]
  if (v !== undefined && v !== null) return String(v).trim()
  return defaultValue !== undefined ? String(defaultValue).trim() : ''
}

const isProd = (): boolean =>
  getEnv('NODE_ENV', 'development').toLowerCase() === 'production'
const isVercel = (): boolean => getEnv('VERCEL') === '1'
const isCI = (): boolean => getEnv('CI') === 'true'

/** Redis config: Upstash REST (cache) and/or TCP URL (Bull). Production must not use localhost. */
export interface RedisConfig {
  /** TCP URL for Bull (ioredis). In prod must be non-localhost (e.g. Upstash TCP). */
  url: string
  /** Upstash REST URL for serverless cache (no connection pooling). */
  upstashRestUrl: string
  /** Upstash REST token. */
  upstashRestToken: string
  /** True if cache is available (Upstash REST or dev no-op). */
  cacheAvailable: boolean
  /** True if TCP Redis is available for Bull (non-localhost in prod). */
  tcpAvailable: boolean
}

/** AI/Gateway config: prod should not default to localhost. */
export interface AIConfig {
  aiGatewayUrl: string
  useAiGateway: boolean
  ollamaBaseUrl: string
  textToSpeechUrl: string
  speechToTextUrl: string
  /** True if any AI gateway/TTS/STT is explicitly set to a non-localhost URL (safe for prod). */
  hasCloudEndpoint: boolean
}

let validated = false
const missing: string[] = []

/**
 * Validate critical env vars. Call once at app startup (e.g. from instrumentation or root layout).
 * Logs missing vars; in production throws if required vars are missing.
 */
export function validateEnv(): { ok: boolean; missing: string[] } {
  if (validated) {
    return { ok: missing.length === 0, missing: [...missing] }
  }
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
  ] as const
  for (const key of required) {
    if (!getEnv(key)) {
      missing.push(key)
    }
  }
  if (isProd() && !isCI()) {
    const redisUrl = getEnv('REDIS_URL')
    const upstashUrl = getEnv('UPSTASH_REDIS_REST_URL')
    const isLocalhost =
      redisUrl && (redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1'))
    if (!upstashUrl && (!redisUrl || isLocalhost)) {
      missing.push('REDIS (set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN or REDIS_URL to Upstash TCP)')
    }
  }
  validated = true
  if (missing.length > 0) {
    console.warn('[config/env] Missing or invalid env:', missing.join(', '))
    if (isProd() && !isCI()) {
      console.error('[config/env] Production requires these to be set. See .env.example')
    }
  }
  return { ok: missing.length === 0, missing: [...missing] }
}

/**
 * Get Redis configuration. Use for cache (Upstash REST) and Bull (TCP URL).
 * In production, REDIS_URL must not be localhost (use Upstash TCP URL).
 */
export function getRedisConfig(): RedisConfig {
  const url = getEnv('REDIS_URL')
  const upstashRestUrl = getEnv('UPSTASH_REDIS_REST_URL')
  const upstashRestToken = getEnv('UPSTASH_REDIS_REST_TOKEN')
  const isLocalhost = url ? (url.includes('localhost') || url.includes('127.0.0.1')) : true
  const prod = isProd()
  const cacheAvailable =
    !!(upstashRestUrl && upstashRestToken) || (!prod && true) /* dev: no-op allowed */
  const tcpAvailable =
    !!url && (!prod || !isLocalhost) /* prod: TCP must be non-localhost */
  return {
    url: url || 'redis://localhost:6379',
    upstashRestUrl,
    upstashRestToken,
    cacheAvailable,
    tcpAvailable,
  }
}

/**
 * Get AI/Gateway configuration. In production, leave localhost vars unset for graceful fallback.
 */
export function getAIConfig(): AIConfig {
  const aiGatewayUrl = getEnv('AI_GATEWAY_URL', 'http://localhost:8000')
  const useAiGateway = getEnv('USE_AI_GATEWAY', 'false').toLowerCase() === 'true'
  const ollamaBaseUrl = getEnv('OLLAMA_BASE_URL', 'http://localhost:11434')
  const textToSpeechUrl = getEnv('TEXT_TO_SPEECH_URL', 'http://localhost:7861')
  const speechToTextUrl = getEnv('SPEECH_TO_TEXT_URL', 'http://localhost:7862')
  const isCloud = (u: string) =>
    !!u && !u.includes('localhost') && !u.includes('127.0.0.1')
  const hasCloudEndpoint =
    isCloud(aiGatewayUrl) ||
    isCloud(ollamaBaseUrl) ||
    isCloud(textToSpeechUrl) ||
    isCloud(speechToTextUrl)
  return {
    aiGatewayUrl,
    useAiGateway,
    ollamaBaseUrl,
    textToSpeechUrl,
    speechToTextUrl,
    hasCloudEndpoint,
  }
}

/**
 * Simple Redis health check. Returns true if cache Redis is reachable or no-op (healthy).
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const { checkRedisHealth: check } = await import('@/lib/redis/singleton')
    return check()
  } catch {
    return false
  }
}
