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
