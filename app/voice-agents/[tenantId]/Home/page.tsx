'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Phone, FileText } from 'lucide-react'
import Link from 'next/link'
import { VoiceAgentList } from '@/components/voice-agent/voice-agent-list'

export default function VoiceAgentsHomePage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { tenant, token } = useAuthStore()
  const [agents, setAgents] = useState<any[]>([])
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
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
      
      const response = await fetch('/api/v1/voice-agents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to fetch agents'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || `HTTP ${response.status}`
        }
        
        console.error('Failed to fetch agents:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
        })
        
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.')
        } else {
          setError(errorMessage)
        }
        
        // Set empty array on error to show empty state
        setAgents([])
        setLoading(false)
        return
      }
      
      const data = await response.json()
      console.log('[VoiceAgents] Fetched agents:', {
        count: data.agents?.length || 0,
        agents: data.agents,
        tenantId: tenant?.id,
        urlTenantId: tenantId,
        pagination: data.pagination,
      })
      setAgents(data.agents || [])
      setError(null)
      setLoading(false)
    } catch (error: any) {
      // Handle network errors, CORS issues, etc.
      console.error('Failed to fetch agents:', error)
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        setError('Request timed out. The server may be slow or unresponsive.')
        setAgents([])
        setLoading(false)
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
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
        setError(error instanceof Error ? error.message : 'An unexpected error occurred')
        setLoading(false)
      }
      
      // Set empty array on error to show empty state
      setAgents([])
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
  }, [token])
  
  // Safety timeout - stop loading after 10 seconds
  useEffect(() => {
    if (!loading) return
    
    const timeout = setTimeout(() => {
      console.warn('[VoiceAgents] Loading timeout - stopping loading state')
      setLoading(false)
      if (!error) {
        setError('Loading took too long. The server may be slow. Please refresh the page or check your connection.')
      }
    }, 10000) // 10 second timeout
    
    return () => clearTimeout(timeout)
  }, [loading, error])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Voice Agents</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage AI voice agents for automated calls
          </p>
        </div>
        <Link href={`/voice-agents/${tenantId}/New`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground">Active voice agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">All time calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Knowledge Bases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Uploaded documents</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAgents()}
              className="mt-2"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <VoiceAgentList 
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

