// React Query hooks for API calls
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'

// Helper to handle 401 errors (invalid/expired token)
// Use a flag to prevent multiple redirects
let isRedirecting = false
function handle401Error() {
  if (isRedirecting) return // Prevent multiple redirects
  isRedirecting = true
  
  const { logout } = useAuthStore.getState()
  logout()
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    // Small delay to prevent rapid redirects
    setTimeout(() => {
      window.location.href = '/login'
    }, 100)
  }
}

// Helper to get auth headers
export function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

// Contacts hooks
export function useContacts(params?: { page?: number; limit?: number; type?: string; stage?: string; status?: string; search?: string }) {
  const queryString = new URLSearchParams()
  if (params?.page) queryString.set('page', params.page.toString())
  if (params?.limit) queryString.set('limit', params.limit.toString())
  if (params?.type) queryString.set('type', params.type)
  if (params?.stage) queryString.set('stage', params.stage) // New: stage parameter
  if (params?.status) queryString.set('status', params.status)
  if (params?.search) queryString.set('search', params.search)

  const queryUrl = queryString.toString() ? `/api/contacts?${queryString}` : '/api/contacts'

  return useQuery({
    queryKey: ['contacts', params],
    queryFn: async () => {
      try {
        const response = await fetch(queryUrl, {
          headers: getAuthHeaders(),
        })
        if (!response.ok) {
          let error: any
          let errorText = ''
          try {
            errorText = await response.text()
            // Check if errorText is empty or just whitespace
            if (!errorText || errorText.trim() === '') {
              error = { 
                error: `HTTP ${response.status}: ${response.statusText}`,
                message: `No error details provided by server`,
              }
            } else {
              try {
                error = JSON.parse(errorText)
                // Check if parsed result is an empty object
                if (Object.keys(error).length === 0) {
                  error = { 
                    error: `HTTP ${response.status}: ${response.statusText}`,
                    message: `Server returned empty error object`,
                    rawResponse: errorText,
                  }
                }
              } catch {
                error = { 
                  error: errorText || `HTTP ${response.status}: ${response.statusText}`,
                  message: errorText || `Failed to fetch contacts (${response.status})`,
                }
              }
            }
          } catch (parseError) {
            error = { 
              error: `Failed to fetch contacts (${response.status})`,
              message: `Failed to parse error response`,
              parseError: parseError instanceof Error ? parseError.message : String(parseError),
            }
          }
          
          // Log the full error details with better diagnostics
          const errorStr = typeof error === 'string' ? error : JSON.stringify(error, null, 2)
          console.error('Contacts API error:', {
            status: response.status,
            statusText: response.statusText,
            url: queryUrl,
            error: errorStr,
            fullError: error,
            hasErrorText: !!errorText,
            errorTextLength: errorText?.length || 0,
          })
          
          // Also log the raw error text if available
          if (errorText && errorText.trim()) {
            console.error('Raw error response:', errorText)
          }
          
          // Handle 401 Unauthorized (invalid/expired token)
          if (response.status === 401 || error.code === 'INVALID_TOKEN') {
            console.warn('Token expired or invalid, logging out and redirecting to login')
            handle401Error()
            // Return a user-friendly error message
            throw new Error('Your session has expired. Please log in again.')
          }
          
          // Include more details in error message
          const errorMsg = error.error || error.message || `Failed to fetch contacts (${response.status})`
          const errorWithDetails = error.code 
            ? `${errorMsg} [Code: ${error.code}]`
            : errorMsg
          throw new Error(errorWithDetails)
        }
        const data = await response.json()
        return data
      } catch (error: any) {
        console.error('Contacts fetch error:', {
          message: error?.message,
          name: error?.name,
          stack: error?.stack,
          error: error,
        })
        // Re-throw with more context if it's a network error
        if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
          throw new Error(`Network error: ${error.message}. Please check your connection.`)
        }
        throw error
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (invalid token) - user needs to log in again
      if (error instanceof Error && (error.message.includes('session has expired') || error.message.includes('INVALID_TOKEN'))) {
        return false
      }
      // Retry other errors up to 2 times
      return failureCount < 2
    },
    retryDelay: 1000, // Wait 1 second between retries
    enabled: true, // Always enable the query
  })
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${id}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch contact')
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create contact')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update contact')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contact', variables.id] })
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete contact')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

// Deals hooks
export function useDeals(params?: { page?: number; limit?: number; stage?: string; contactId?: string; bypassCache?: boolean; tenantId?: string }) {
  const queryString = new URLSearchParams()
  if (params?.page) queryString.set('page', params.page.toString())
  if (params?.limit) queryString.set('limit', params.limit.toString())
  if (params?.stage) queryString.set('stage', params.stage)
  if (params?.contactId) queryString.set('contactId', params.contactId)
  // CRITICAL: Add bypassCache parameter to force fresh data from database
  if (params?.bypassCache) queryString.set('bypassCache', 'true')
  // When viewing CRM by tenant (e.g. /crm/[tenantId]/Deals), pass tenantId so API returns that tenant's deals
  if (params?.tenantId) queryString.set('tenantId', params.tenantId)

  return useQuery({
    queryKey: ['deals', params],
    queryFn: async () => {
      try {
        const url = `/api/deals?${queryString}`
        console.log('[useDeals] Fetching deals from:', url)
        const response = await fetch(url, {
          headers: getAuthHeaders(),
        })
        console.log('[useDeals] Response status:', response.status, response.statusText)
        
        if (!response.ok) {
          // If 500 error, return empty data instead of throwing
          if (response.status === 500) {
            console.warn('[useDeals] Server returned 500, returning empty data')
            return { deals: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }, pipelineSummary: [] }
          }
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch deals' }))
          console.error('[useDeals] API error:', errorData)
          throw new Error(errorData.message || errorData.error || 'Failed to fetch deals')
        }
        const data = await response.json()
        console.log('[useDeals] Received data:', { 
          dealsCount: data?.deals?.length || 0, 
          total: data?.pagination?.total || 0,
          hasDeals: !!data?.deals,
          dataKeys: Object.keys(data || {})
        })
        
        // Log debug info if available (when no deals found)
        if (data?._debug) {
          console.warn('[useDeals] ⚠️ NO DEALS FOUND - DEBUG INFO:', {
            tenantId: data._debug.tenantId,
            totalDealsForTenant: data._debug.actualDealCountForTenant || data._debug.totalDealsForTenant,
            totalDealsInDatabase: data._debug.totalDealsInDatabase,
            quickCheck: data._debug.quickCheck,
            queryWhere: data._debug.queryWhere,
            sampleDeal: data._debug.sampleDeal,
            allDealsSample: data._debug.allDealsSample,
            message: data._debug.message,
            retryAttempted: data._debug.retryAttempted,
          })
        }
        
        return data
      } catch (error: any) {
        console.error('[useDeals] Error fetching deals:', error)
        // Return empty data structure instead of throwing to prevent UI crashes
        return { deals: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }, pipelineSummary: [] }
      }
    },
    retry: false, // Don't retry on error to prevent multiple failed requests
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch on mount if data exists
  })
}

export function useCreateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        // Prioritize the user-friendly message if available
        if (error.message) {
          throw new Error(error.message)
        }
        // If there are validation details, include them in the error message
        if (error.details && Array.isArray(error.details)) {
          const details = error.details.map((d: any) => {
            const field = d.path?.join('.') || 'field'
            return `${field}: ${d.message || 'Invalid value'}`
          }).join('. ')
          throw new Error(`${error.error || 'Validation error'}: ${details}`)
        }
        throw new Error(error.error || error.message || 'Failed to create deal')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
    },
  })
}

export function useDeleteDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/deals/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete deal')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['deal'] })
    },
  })
}

export function useUpdateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/deals/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update deal')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
    },
  })
}

// Products hooks
export function useProducts(params?: { page?: number; limit?: number; search?: string; category?: string; lowStock?: boolean }) {
  const queryString = new URLSearchParams()
  if (params?.page) queryString.set('page', params.page.toString())
  if (params?.limit) queryString.set('limit', params.limit.toString())
  if (params?.search) queryString.set('search', params.search)
  if (params?.category) queryString.set('category', params.category)
  if (params?.lowStock) queryString.set('lowStock', 'true')

  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const response = await fetch(`/api/products?${queryString}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json()
    },
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create product')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update product')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] })
    },
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update invoice')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] })
    },
  })
}

// Orders hooks
export function useOrders(params?: { page?: number; limit?: number; status?: string; customerId?: string }) {
  const queryString = new URLSearchParams()
  if (params?.page) queryString.set('page', params.page.toString())
  if (params?.limit) queryString.set('limit', params.limit.toString())
  if (params?.status) queryString.set('status', params.status)
  if (params?.customerId) queryString.set('customerId', params.customerId)

  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const response = await fetch(`/api/orders?${queryString}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch orders')
      return response.json()
    },
  })
}

// Invoices hooks
export function useInvoices(params?: { page?: number; limit?: number; status?: string; customerId?: string }) {
  const queryString = new URLSearchParams()
  if (params?.page) queryString.set('page', params.page.toString())
  if (params?.limit) queryString.set('limit', params.limit.toString())
  if (params?.status) queryString.set('status', params.status)
  if (params?.customerId) queryString.set('customerId', params.customerId)

  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const response = await fetch(`/api/invoices?${queryString}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch invoices')
      return response.json()
    },
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await fetch(`/api/invoices/${id}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch invoice')
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await fetch('/api/invoices', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        })
        
        if (!response.ok) {
          let error: any
          try {
            const errorText = await response.text()
            try {
              error = JSON.parse(errorText)
            } catch {
              error = { error: errorText || `HTTP ${response.status}: ${response.statusText}` }
            }
          } catch (parseError) {
            error = { error: `Failed to create invoice (${response.status})` }
          }
          
          console.error('Create invoice API error:', {
            status: response.status,
            statusText: response.statusText,
            error: JSON.stringify(error, null, 2),
          })
          
          // Prioritize the user-friendly message if available
          if (error.message) {
            throw new Error(error.message)
          }
          // If there are validation details, include them in the error message
          if (error.details && Array.isArray(error.details)) {
            const details = error.details.map((d: any) => {
              const field = d.path?.join('.') || 'field'
              return `${field}: ${d.message || 'Invalid value'}`
            }).join('. ')
            throw new Error(`${error.error || 'Validation error'}: ${details}`)
          }
          throw new Error(error.error || error.message || `Failed to create invoice (${response.status})`)
        }
        return response.json()
      } catch (error: any) {
        console.error('Create invoice fetch error:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${id}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch order')
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create order')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch product')
      return response.json()
    },
    enabled: !!id,
  })
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ['deal', id],
    queryFn: async () => {
      const response = await fetch(`/api/deals/${id}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch deal')
      return response.json()
    },
    enabled: !!id,
  })
}

// Tasks hooks
export function useTasks(params?: { page?: number; limit?: number; status?: string; assignedToId?: string; contactId?: string }) {
  const queryString = new URLSearchParams()
  if (params?.page) queryString.set('page', params.page.toString())
  if (params?.limit) queryString.set('limit', params.limit.toString())
  if (params?.status) queryString.set('status', params.status)
  if (params?.assignedToId) queryString.set('assignedToId', params.assignedToId)
  if (params?.contactId) queryString.set('contactId', params.contactId)

  return useQuery({
    queryKey: ['tasks', params],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?${queryString}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch tasks')
      return response.json()
    },
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${id}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch task')
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update task')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete task')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// Marketing Campaigns hooks
export function useCampaigns(params?: { page?: number; limit?: number; type?: string }) {
  const queryString = new URLSearchParams()
  if (params?.page) queryString.set('page', params.page.toString())
  if (params?.limit) queryString.set('limit', params.limit.toString())
  if (params?.type) queryString.set('type', params.type)

  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: async () => {
      const response = await fetch(`/api/marketing/campaigns?${queryString}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.details || errorData.error || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }
      return response.json()
    },
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      type: 'email' | 'whatsapp' | 'sms'
      subject?: string
      content: string
      segmentId?: string
      contactIds?: string[]
      scheduledFor?: string
    }) => {
      const response = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create campaign')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

// Tenant/Settings hooks
export function useTenant() {
  return useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      const response = await fetch('/api/settings/tenant', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch tenant settings')
      return response.json()
    },
  })
}
