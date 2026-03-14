'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Phone, BarChart3, Mic } from 'lucide-react'
import Link from 'next/link'
import { VoiceAgentTable } from '@/components/voice-agent/voice-agent-table'

export default function VoiceAgentsHomePage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.tenantId as string
  const { tenant, token } = useAuthStore()
  const [agents, setAgents] = useState<any[]>([])
  const [overview, setOverview] = useState<{ totalAgents: number; totalCalls: number; totalMinutes: number; conversionRate: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAgents = async (retryCount = 0) => {
    if (!token) {
      console.error('No token available')
      setLoading(false)
      setError('Authentication required. Please log in again.')
      return
    }
    
    console.log('[VoiceAgents] Fetching agents:', {
      tenantId: tenant?.id,
      urlTenantId: tenantId,
      hasToken: !!token,
    })
    
    try {
      setError(null)
      setLoading(true)
      
      const controller = new AbortController()
      const timeoutMs = 35_000
      const timeoutId = setTimeout(() => controller.abort(new DOMException(`Request timed out after ${timeoutMs / 1000}s`, 'AbortError')), timeoutMs)
      try {
        const listUrl = new URL('/api/v1/voice-agents', window.location.origin)
        listUrl.searchParams.set('includeStats', 'true')
        listUrl.searchParams.set('tenantId', tenantId)
        const response = await fetch(listUrl.toString(), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch agents'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          errorMessage = response.statusText || `HTTP ${response.status}`
        }
        console.error('Failed to fetch agents:', { status: response.status, message: errorMessage })
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.')
        } else {
          setError(errorMessage)
        }
        setAgents([])
        setLoading(false)
        return
      }
      const data = await response.json()
      console.log('[VoiceAgents] Fetched agents:', {
        count: data.agents?.length || 0,
        agents: data.agents,
        overview: data.overview,
        tenantId: tenant?.id,
        urlTenantId: tenantId,
        pagination: data.pagination,
      })
      setAgents(data.agents || [])
      setOverview(data.overview ?? null)
      setError(null)
      setLoading(false)
      return
      } finally {
        clearTimeout(timeoutId)
      }
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string }
      if (err.name === 'AbortError') {
        if (retryCount < 1) {
          setTimeout(() => fetchAgents(retryCount + 1), 1500)
          return
        }
        setError('Request timed out. The server or database may be slow. Click Retry below to try again.')
        setAgents([])
        setLoading(false)
        return
      }
      console.error('Failed to fetch agents:', error)
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        const errorMsg = retryCount < 2 
          ? 'Server is starting up, retrying...' 
          : 'Unable to connect to server. Please ensure the development server is running on http://localhost:3000'
        
        setError(errorMsg)
        
        // Retry up to 2 times if it's a network error
        if (retryCount < 2) {
          setTimeout(() => {
            fetchAgents(retryCount + 1)
          }, 2000 * (retryCount + 1)) // Exponential backoff: 2s, 4s
          // Don't set loading to false yet - we're retrying
          return
        } else {
          // Max retries reached, stop loading
          setLoading(false)
        }
      } else {
        setError(error instanceof Error ? (error as Error).message : 'An unexpected error occurred')
        setAgents([])
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    let mounted = true

    if (token) {
      fetchAgents().finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })
    } else {
      setLoading(false)
    }

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tenantId])

  // If list is empty and URL tenant differs from auth tenant, redirect to auth tenant so user sees their agents
  useEffect(() => {
    if (loading || error || agents.length > 0) return
    const authTenantId = tenant?.id
    if (!authTenantId || authTenantId === tenantId) return
    router.replace(`/voice-agents/${authTenantId}/Home`)
  }, [loading, error, agents.length, tenant?.id, tenantId, router])
  
  // Safety timeout - stop loading after 45s so we don't block UI forever (fetch timeout is 35s + 1 retry)
  useEffect(() => {
    if (!loading) return
    
    const timeout = setTimeout(() => {
      console.warn('[VoiceAgents] Loading timeout - stopping loading state')
      setLoading(false)
      if (!error) {
        setError('Loading took too long. The server may be slow. Click Retry below to try again.')
      }
    }, 45_000)
    
    return () => clearTimeout(timeout)
  }, [loading, error])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Voice Agents</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage AI voice agents for automated calls
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/voice-agents/${tenantId}/create`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Agent
            </Button>
          </Link>
          <Link href={`/voice-agents/${tenantId}/Campaigns`}>
            <Button variant="outline">Campaigns</Button>
          </Link>
          <Link href={`/voice-agents/${tenantId}/Analytics`}>
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Link href={`/voice-agents/${tenantId}/Demo`}>
            <Button variant="outline">
              <Mic className="mr-2 h-4 w-4" />
              Demo
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agents</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalAgents ?? agents.length}</div>
            <p className="text-xs text-muted-foreground">Active voice agents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minutes</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalMinutes ?? 0}</div>
            <p className="text-xs text-muted-foreground">Total call minutes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.conversionRate ?? 0}%</div>
            <p className="text-xs text-muted-foreground">Completed / total calls</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchAgents()} className="mt-2">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <VoiceAgentTable
        agents={agents}
        loading={loading}
        onRefresh={() => {
          setLoading(true)
          fetchAgents()
        }}
      />
    </div>
  )
}

