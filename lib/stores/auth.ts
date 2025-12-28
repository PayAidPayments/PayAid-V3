import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  avatar: string | null
}

interface Tenant {
  id: string
  name: string
  subdomain: string | null
  plan: string
  // NEW: Module licensing (Phase 1)
  licensedModules?: string[]
  subscriptionTier?: string
}

interface AuthState {
  user: User | null
  tenant: Tenant | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    name: string
    tenantName: string
    subdomain: string
  }) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

// SSR-safe storage implementation
const getSSRSafeStorage = () => {
  if (typeof window === 'undefined') {
    // Return a no-op storage for SSR
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }
  }

  // Client-side: use localStorage with error handling
  return {
    getItem: (name: string): string | null => {
      try {
        return localStorage.getItem(name)
      } catch (error) {
        console.error('Error reading from localStorage:', error)
        return null
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        localStorage.setItem(name, value)
      } catch (error) {
        console.error('Error writing to localStorage:', error)
      }
    },
    removeItem: (name: string): void => {
      try {
        localStorage.removeItem(name)
      } catch (error) {
        console.error('Error removing from localStorage:', error)
      }
    },
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      token: null,
      isAuthenticated: false,
      isLoading: false, // Start as false - will be set during hydration if needed

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          if (!response.ok) {
            let errorMessage = 'Login failed'
            try {
              const error = await response.json()
              errorMessage = error.error || error.message || `Login failed (${response.status})`
              console.error('[AUTH] Login error response:', error)
            } catch (parseError) {
              // If JSON parsing fails, use status text
              errorMessage = `Login failed: ${response.statusText || response.status}`
              console.error('[AUTH] Failed to parse error response:', parseError)
            }
            throw new Error(errorMessage)
          }

          const data = await response.json()
          
          if (!data.user || !data.token) {
            console.error('[AUTH] Invalid response data:', data)
            throw new Error('Invalid response from server')
          }
          
          // Store token in cookie for middleware access
          if (typeof document !== 'undefined') {
            // Set cookie with 7 day expiration
            const expires = new Date()
            expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
            const isSecure = window.location.protocol === 'https:'
            document.cookie = `token=${data.token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`
          }
          
          set({
            user: data.user,
            tenant: {
              ...data.tenant,
              licensedModules: data.tenant?.licensedModules || [],
              subscriptionTier: data.tenant?.subscriptionTier || 'free',
            },
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          console.error('[AUTH] Login error:', error)
          set({ isLoading: false })
          throw error
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Registration failed')
          }

          const result = await response.json()
          
          // Store token in cookie for middleware access
          if (typeof document !== 'undefined') {
            // Set cookie with 7 day expiration
            const expires = new Date()
            expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
            const isSecure = window.location.protocol === 'https:'
            document.cookie = `token=${result.token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`
          }
          
          set({
            user: result.user,
            tenant: result.tenant,
            token: result.token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        // Clear cookie
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        }
        
        set({
          user: null,
          tenant: null,
          token: null,
          isAuthenticated: false,
        })
      },

      fetchUser: async () => {
        const { token } = get()
        if (!token) {
          set({ isAuthenticated: false, isLoading: false })
          return
        }

        set({ isLoading: true })
        try {
          // Add timeout to prevent hanging - reduced to 2 seconds for faster failure
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout

          const response = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            // Only clear token if it's a 401 (unauthorized)
            if (response.status === 401) {
              set({
                isAuthenticated: false,
                isLoading: false,
                user: null,
                tenant: null,
                token: null,
              })
              return
            }
            throw new Error('Failed to fetch user')
          }

          const userData = await response.json()
          
          // CRITICAL: Always use tenant data from API response (database source of truth)
          // If token had wrong tenantId, API will return correct tenant from database
          const tenantFromDb = userData.tenant
          
          // If tenant ID from API doesn't match token's tenantId, we need to refresh token
          const tokenTenantId = (() => {
            try {
              const decoded = JSON.parse(atob(token.split('.')[1]))
              return decoded.tenantId
            } catch {
              return null
            }
          })()
          
          if (tenantFromDb && tokenTenantId && tenantFromDb.id !== tokenTenantId) {
            console.warn(
              `⚠️ Tenant ID mismatch: Token has ${tokenTenantId}, ` +
              `Database has ${tenantFromDb.id}. Token needs refresh.`
            )
            // Token will be refreshed on next login, but use DB tenant for now
          }
          
          set({
            user: {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
              avatar: userData.avatar,
            },
            tenant: tenantFromDb ? {
              id: tenantFromDb.id, // Always use database tenant ID (source of truth)
              name: tenantFromDb.name,
              subdomain: tenantFromDb.subdomain,
              plan: tenantFromDb.plan,
              licensedModules: tenantFromDb.licensedModules || [],
              subscriptionTier: tenantFromDb.subscriptionTier || 'free',
            } : null,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          console.error('Failed to fetch user:', error)
          
          // Handle abort/timeout errors
          if (error instanceof Error && error.name === 'AbortError') {
            console.warn('User fetch timed out after 5 seconds')
          }
          
          // Don't clear token on network errors, only on auth errors
          // The token might still be valid, just a network issue
          set({
            isLoading: false,
            // Keep existing auth state if token exists
            isAuthenticated: !!token,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => getSSRSafeStorage()),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        tenant: state.tenant ? {
          ...state.tenant,
          licensedModules: state.tenant.licensedModules || [],
          subscriptionTier: state.tenant.subscriptionTier || 'free',
        } : null,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          // After rehydration, set isLoading to false immediately
          if (error) {
            console.error('Rehydration error:', error)
          }
          if (state) {
            // Sync token to cookie if it exists (for middleware access)
            if (state.token && typeof document !== 'undefined') {
              const expires = new Date()
              expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
              const isSecure = window.location.protocol === 'https:'
              document.cookie = `token=${state.token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`
            }
            
            // Immediately set loading to false after rehydration
            state.isLoading = false
            // If we have a token but not authenticated, mark as authenticated
            // (the token was persisted, so it should be valid)
            if (state.token && !state.isAuthenticated) {
              state.isAuthenticated = true
            }
          } else {
            // If state is null/undefined, still set loading to false immediately
            useAuthStore.setState({ isLoading: false })
          }
        }
      },
    }
  )
)
