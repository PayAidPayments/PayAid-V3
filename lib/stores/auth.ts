import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  roles?: string[]
  avatar: string | null
}

interface Tenant {
  id: string
  slug?: string | null
  name: string
  subdomain: string | null
  plan: string
  // NEW: Module licensing (Phase 1)
  licensedModules?: string[]
  subscriptionTier?: string
  defaultCurrency?: string
}

interface AuthState {
  user: User | null
  tenant: Tenant | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ user: User; tenant: Tenant | null; token: string }>
  register: (data: {
    email: string
    password: string
    name: string
    tenantName: string
    subdomain: string
    planType?: 'single' | 'multi' | 'suite'
    selectedModules?: string[]
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
        if (!get().isLoading) {
          set({ isLoading: true })
        }
        let timeoutId: NodeJS.Timeout | null = null
        try {
          // Add timeout to prevent hanging.
          // IMPORTANT: keep client timeout longer than server timeout so
          // the browser does not abort right as the server finishes.
          // Local dev can spend a long time compiling on first auth request.
          // Keep dev timeout extremely high so compile delay doesn't fail sign-in.
          // Prod timeout remains bounded to avoid hanging indefinitely.
          const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'
          const timeoutMs = isDev ? 300000 : 120000
          const controller = new AbortController()
          
          // Set up timeout
          timeoutId = setTimeout(() => {
            if (!controller.signal.aborted) {
              controller.abort('Login request timeout')
              console.warn(`[AUTH] Login request timed out after ${timeoutMs / 1000} seconds`)
            }
          }, timeoutMs)
          
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            signal: controller.signal,
          })
          
          // Clear timeout if request completed successfully
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }

          // Check content type before parsing
          const contentType = response.headers.get('content-type') || ''
          const isJson = contentType.includes('application/json')

          if (!response.ok) {
            let errorMessage = 'Login failed'
            try {
              if (isJson) {
                const error = await response.json()
                // Prefer message (user-facing) then error (code), then status
                errorMessage =
                  (error && (error.message || error.error)) ||
                  `Login failed (${response.status})`
                const isTimeoutLikeMessage =
                  typeof errorMessage === 'string' &&
                  (errorMessage.includes('timeout') ||
                    errorMessage.includes('timed out') ||
                    errorMessage.includes('longer than usual') ||
                    errorMessage.includes('warm-up/compile'))
                if (error && typeof error === 'object' && (Object.keys(error).length === 0 || !error.message)) {
                  console.error('[AUTH] Login error response:', response.status, response.statusText, error)
                } else if (isTimeoutLikeMessage) {
                  // Expected during cold starts / compile delays; keep console quieter.
                  console.warn('[AUTH] Login timeout-like response:', errorMessage)
                } else {
                  console.error('[AUTH] Login error:', errorMessage)
                }
              } else {
                // Server returned HTML or other non-JSON error page
                let text = ''
                try {
                  text = await response.text()
                } catch (textError) {
                  console.error('[AUTH] Failed to read response text:', textError)
                  text = '[Unable to read response body]'
                }
                
                console.error('[AUTH] Server returned non-JSON error:', response.status, response.statusText, contentType, response.url)
                if (response.status === 404) {
                  errorMessage = 'Login API not found. Restart the app with npm run dev or npm run dev:all so the dashboard API runs.'
                } else {
                  errorMessage = `Login failed: ${response.statusText || 'Internal Server Error'}`
                }
              }
            } catch (parseError) {
              // If parsing fails, use status text
              errorMessage = `Login failed: ${response.statusText || response.status}`
              console.error('[AUTH] Failed to parse error response:', parseError)
            }
            throw new Error(errorMessage)
          }

          // Ensure response is JSON before parsing
          if (!isJson) {
            const text = await response.text()
            console.error('[AUTH] Server returned non-JSON response:', {
              status: response.status,
              contentType,
              preview: text.substring(0, 200),
            })
            throw new Error('Server returned invalid response format')
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
          
          const tenantData = data.tenant ? {
            ...data.tenant,
            slug: data.tenant?.slug ?? null,
            licensedModules: data.tenant?.licensedModules || [],
            subscriptionTier: data.tenant?.subscriptionTier || 'free',
          } : null
          
          set({
            user: data.user,
            tenant: tenantData,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          })
          
          // Return the login data for immediate use
          return {
            user: data.user,
            tenant: tenantData,
            token: data.token,
          }
        } catch (error) {
          // Clear timeout if still active
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          
          set({ isLoading: false })
          
          // Check for timeout/abort errors FIRST before logging
          let isTimeoutError = false
          
          // Check if error is a string
          if (typeof error === 'string') {
            if (error.includes('timeout') || error.includes('aborted') || error.includes('Login request timeout')) {
              isTimeoutError = true
            }
          }
          // Check if error is an Error instance
          else if (error instanceof Error) {
            isTimeoutError = error.name === 'AbortError' || 
                            error.message?.includes('aborted') ||
                            error.message?.includes('timeout') ||
                            error.message?.includes('Login request timeout')
          }
          // Check if error is a DOMException (which browsers throw for abort)
          else if (error && typeof error === 'object') {
            const errorObj = error as any
            isTimeoutError = errorObj.name === 'AbortError' || 
                            errorObj.name === 'DOMException' ||
                            errorObj.code === 'ABORT_ERR' ||
                            errorObj.message?.includes('aborted') ||
                            errorObj.message?.includes('timeout') ||
                            errorObj.message?.includes('Login request timeout')
          }
          
          // Handle timeout error - don't log, just throw user-friendly message
          if (isTimeoutError) {
            throw new Error('Login is taking longer than usual due to server warm-up/compile. Please wait and try again.')
          }
          
          // Log non-timeout errors for debugging
          console.error('[AUTH] Login error:', error)
          
          // Handle network errors
          if (error instanceof Error) {
            if (error.message.includes('Failed to fetch') || 
                error.message.includes('NetworkError') ||
                error.message.includes('Network request failed')) {
              throw new Error('Network error. Please check your internet connection and try again.')
            }
            // Keep original error message if it's already descriptive
            throw error
          }
          
          // Handle string errors
          if (typeof error === 'string') {
            throw new Error(error)
          }
          
          throw new Error('An unexpected error occurred during login. Please try again.')
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
        // Clear all auth-related storage
        if (typeof document !== 'undefined') {
          // Clear cookies (all variations)
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax'
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; Secure'
          
          // Clear localStorage
          try {
            localStorage.removeItem('auth-storage')
            localStorage.removeItem('token')
            localStorage.removeItem('auth-token')
            localStorage.removeItem('payaid_sso_token')
          } catch (err) {
            console.warn('[AUTH] Error clearing localStorage:', err)
          }
          
          // Clear sessionStorage
          try {
            sessionStorage.removeItem('payaid_sso_token')
            sessionStorage.removeItem('token')
            sessionStorage.removeItem('auth-token')
          } catch (err) {
            console.warn('[AUTH] Error clearing sessionStorage:', err)
          }
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
        const authMeTimeoutMs = 15000
        try {
          // Add timeout to prevent hanging.
          // Keep this comfortably above normal cold-start/database retry windows
          // to avoid aborting healthy-but-slow responses.
          const controller = new AbortController()
          const timeoutId = setTimeout(() => {
            if (!controller.signal.aborted) {
              controller.abort(`Auth me request timeout after ${authMeTimeoutMs}ms`)
            }
          }, authMeTimeoutMs)

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
            
            // Handle 503 (Service Unavailable) gracefully - don't clear auth state
            // This happens when database is temporarily unavailable (circuit breaker, pool exhaustion)
            // Keep existing auth state and just mark as not loading
            if (response.status === 503) {
              console.warn('[AUTH] /api/auth/me returned 503 - database temporarily unavailable. Keeping existing auth state.')
              set({
                isLoading: false,
                // Keep existing auth state - don't clear it
                // User is still authenticated, just can't verify right now
              })
              return
            }
            
            // Check if response is JSON before parsing
            const contentType = response.headers.get('content-type') || ''
            if (!contentType.includes('application/json')) {
              // Non-JSON response (likely HTML error page)
              console.warn('[AUTH] /api/auth/me returned non-JSON response:', response.status, response.statusText)
              // Don't clear auth state for non-JSON errors - might be temporary
              set({
                isLoading: false,
                // Keep existing auth state
              })
              return
            }
            throw new Error('Failed to fetch user')
          }

          // Check content type before parsing
          const contentType = response.headers.get('content-type') || ''
          if (!contentType.includes('application/json')) {
            console.warn('[AUTH] /api/auth/me returned non-JSON response')
            set({
              isAuthenticated: false,
              isLoading: false,
            })
            return
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
              slug: tenantFromDb.slug ?? null,
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
          // Handle abort/timeout errors gracefully without noisy console errors.
          const isAbortTimeout =
            (error instanceof Error && error.name === 'AbortError') ||
            (typeof error === 'string' && error.includes('timeout')) ||
            (typeof error === 'string' && error.includes('aborted')) ||
            (typeof error === 'object' &&
              error !== null &&
              (error as any).name === 'AbortError')

          if (isAbortTimeout) {
            console.warn(`[AUTH] User fetch timed out after ${authMeTimeoutMs / 1000} seconds`)
            set({
              isLoading: false,
              // Keep existing auth state if token exists
              isAuthenticated: !!token,
            })
            return
          }

          console.error('Failed to fetch user:', error)
          
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
            return
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
            
            // If we have a token, mark as authenticated
            // This ensures auth state is stable immediately after rehydration
            if (state.token) {
              state.isAuthenticated = true
            } else {
              // No token - definitely not authenticated
              state.isAuthenticated = false
            }
          }
        }
      },
    }
  )
)
