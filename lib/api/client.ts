// API client helper for authenticated requests
import { useAuthStore } from '@/lib/stores/auth'

/**
 * Get authentication headers for API requests
 * Returns headers with Bearer token if user is authenticated
 */
export function getAuthHeaders(): Record<string, string> {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

/**
 * Make an authenticated API request
 */
export async function apiRequest(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { token } = useAuthStore.getState()

  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const controller = new AbortController()
  const timeoutMs = options.timeoutMs ?? 30000
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}
