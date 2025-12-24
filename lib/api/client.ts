// API client helper for authenticated requests
import { useAuthStore } from '@/lib/stores/auth'

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { token } = useAuthStore.getState()

  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
