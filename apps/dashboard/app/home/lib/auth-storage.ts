/** Shared auth read for tenant home routes (Zustand persist may lag behind first paint). */
export function getAuthFromStorage() {
  let token: string | null = null
  let tenant: { id?: string; slug?: string | null } | null = null
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('auth-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        token = parsed.state?.token ?? null
        tenant = parsed.state?.tenant ?? null
      }
    } catch {
      // ignore
    }
  }
  return { token, tenant }
}
