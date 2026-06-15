'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, MessageSquare, Headphones, Monitor } from 'lucide-react'

const BrowserDemoV1 = dynamic(
  () => import('@/components/voice-agent/BrowserDemoV1').then((m) => ({ default: m.BrowserDemoV1 })),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading demo…</div> }
)

const VoiceAgentDemoExperimentalPanel = dynamic(
  () =>
    import('@/components/voice-agent/VoiceAgentDemoExperimentalPanel').then((m) => ({
      default: m.VoiceAgentDemoExperimentalPanel,
    })),
  { ssr: false }
)

const SHOW_EXPERIMENTAL_REALTIME_DEMO =
  process.env.NEXT_PUBLIC_VOICE_EXPERIMENTAL_REALTIME_DEMO === '1'

type Agent = {
  id: string
  name: string
  description?: string | null
  language?: string | null
  status?: string | null
  workflow?: unknown
}

type FetchError = 'unauthorized' | 'not_found' | 'error' | null

function getAuthToken(stored: string | null | undefined): string | null {
  if (stored) return stored
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token') || localStorage.getItem('auth-token')
}

export function VoiceAgentDemoWorkspace() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantId = params.tenantId as string
  const agentId = searchParams.get('agentId')
  const { token, tenant } = useAuthStore()

  const [agent, setAgent] = useState<Agent | null>(null)
  const [fetchError, setFetchError] = useState<FetchError>(null)
  const [serverErrorMessage, setServerErrorMessage] = useState<string | null>(null)
  const [loadingAgent, setLoadingAgent] = useState(true)
  const [demoAgentsList, setDemoAgentsList] = useState<{ id: string; name: string }[]>([])
  const [loadingDemoAgents, setLoadingDemoAgents] = useState(false)
  const [demoAgentsError, setDemoAgentsError] = useState<string | null>(null)

  const loadDemoAgents = () => {
    const authToken = getAuthToken(token)
    if (!authToken) {
      setDemoAgentsError('Please log in to see your agents.')
      setDemoAgentsList([])
      return
    }
    setLoadingDemoAgents(true)
    setDemoAgentsError(null)
    const listUrl = new URL('/api/v1/voice-agents', window.location.origin)
    listUrl.searchParams.set('tenantId', tenantId)
    fetch(listUrl.toString(), { headers: { Authorization: `Bearer ${authToken}` } })
      .then((r) => {
        if (!r.ok) {
          setDemoAgentsError('Could not load agents. Click Retry to try again.')
          setDemoAgentsList([])
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (data == null) return
        const list = data?.agents ?? data ?? []
        setDemoAgentsList(Array.isArray(list) ? list : [])
        setDemoAgentsError(null)
      })
      .catch(() => {
        setDemoAgentsError('Could not load agents. Click Retry to try again.')
        setDemoAgentsList([])
      })
      .finally(() => setLoadingDemoAgents(false))
  }

  const fetchAgent = async () => {
    const authToken = getAuthToken(token)
    if (!agentId || !tenantId) {
      setLoadingAgent(false)
      return
    }
    if (!authToken) {
      setLoadingAgent(false)
      setFetchError(null)
      return
    }

    try {
      setLoadingAgent(true)
      setFetchError(null)
      setServerErrorMessage(null)

      const controller = new AbortController()
      const timeoutMs = 15000
      const timeoutId = setTimeout(
        () => controller.abort(new DOMException(`Request timed out after ${timeoutMs / 1000}s`, 'AbortError')),
        timeoutMs
      )

      const url = new URL(`/api/v1/voice-agents/${agentId}`, window.location.origin)
      url.searchParams.set('tenantId', tenantId)
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${authToken}` },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setAgent(data)
        setFetchError(null)
      } else {
        if (response.status === 401) setFetchError('unauthorized')
        else if (response.status === 404) setFetchError('not_found')
        else setFetchError('error')

        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}))
          if (response.status !== 401 && response.status !== 404) {
            setServerErrorMessage((errorData as { error?: string })?.error || null)
          }
          if (response.status === 404) {
            setServerErrorMessage(
              (errorData as { error?: string })?.error || 'Agent not found for this tenant.'
            )
          }
        } else if (response.status === 404) {
          setServerErrorMessage('Agent not found (or invalid demo link). Please pick an agent from the list.')
        } else if (response.status !== 401) {
          setServerErrorMessage('Server returned an unexpected response. Please try again.')
        }
      }
    } catch (error: unknown) {
      setFetchError('error')
      setServerErrorMessage(
        error instanceof DOMException && error.name === 'AbortError'
          ? 'Request timed out. Please try again.'
          : null
      )
    } finally {
      setLoadingAgent(false)
    }
  }

  useEffect(() => {
    if (agentId && tenantId) {
      fetchAgent()
    } else if (!agentId) {
      setLoadingAgent(false)
      loadDemoAgents()
    } else {
      setLoadingAgent(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when route auth context changes
  }, [agentId, token, tenantId])

  useEffect(() => {
    if (!loadingAgent) return
    const timeout = setTimeout(() => setLoadingAgent(false), 10000)
    return () => clearTimeout(timeout)
  }, [loadingAgent])

  if (loadingAgent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-muted-foreground">Loading agent...</p>
        <Button variant="outline" size="sm" onClick={() => setLoadingAgent(false)}>
          Cancel Loading
        </Button>
      </div>
    )
  }

  if (!agentId) {
    return (
      <div className="container mx-auto p-6 max-w-2xl space-y-6">
        <Link href={`/voice-agents/${tenantId}/Home`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Try a voice agent demo
            </CardTitle>
            <CardDescription>
              Select an agent for the browser demo (typed messages — no phone call required).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingDemoAgents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : demoAgentsError ? (
              <div className="space-y-3 py-4">
                <p className="text-sm text-amber-600 dark:text-amber-400 text-center">{demoAgentsError}</p>
                <Button variant="outline" className="w-full" onClick={loadDemoAgents}>
                  Retry
                </Button>
              </div>
            ) : demoAgentsList.length === 0 ? (
              <div className="space-y-3 py-4">
                <p className="text-sm text-muted-foreground text-center">No agents yet. Create one first.</p>
                <Link href={`/voice-agents/${tenantId}/create`}>
                  <Button className="w-full">Create Agent</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {demoAgentsList.map((a) => (
                  <Link key={a.id} href={`/voice-agents/${tenantId}/Demo?agentId=${a.id}`}>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Open browser demo — {a.name}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!agent || fetchError) {
    const isDifferentWorkspace =
      fetchError === 'not_found' &&
      serverErrorMessage?.toLowerCase().includes('tenant')

    return (
      <div className="container mx-auto p-6 max-w-lg">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            {!token ? (
              <>
                <p className="text-muted-foreground font-medium">Please log in to try the demo</p>
                <Link href={`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : `/voice-agents/${tenantId}/Demo`)}`}>
                  <Button>Log in</Button>
                </Link>
              </>
            ) : fetchError === 'unauthorized' ? (
              <>
                <p className="text-muted-foreground font-medium">Session expired or unauthorized</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                  <Link href={`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : `/voice-agents/${tenantId}/Demo`)}`}>
                    <Button>Log in again</Button>
                  </Link>
                  <Button variant="outline" onClick={() => { setFetchError(null); fetchAgent() }}>
                    Retry
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-muted-foreground font-medium">
                  {fetchError === 'not_found' ? 'Agent not found' : 'Could not load agent'}
                </p>
                {serverErrorMessage && (
                  <p className="text-sm text-muted-foreground">{serverErrorMessage}</p>
                )}
                <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2 flex-wrap">
                  <Button variant="outline" onClick={() => { setFetchError(null); fetchAgent() }}>
                    Retry
                  </Button>
                  <Link href={`/voice-agents/${tenantId}/Home`}>
                    <Button variant="outline">Go to Voice Agents</Button>
                  </Link>
                  {isDifferentWorkspace && (
                    <Link href={`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : `/voice-agents/${tenantId}/Home`)}`}>
                      <Button variant="outline">Go to Login</Button>
                    </Link>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const languageLabel =
    agent.language === 'hi' ? 'Hindi' : agent.language === 'ta' ? 'Tamil' : 'English'

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="container mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/voice-agents/${tenantId}/Home`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Browser demo — {agent.name}</h1>
              <p className="text-sm text-muted-foreground">
                Type messages to test the agent in your browser. No Twilio or phone call is required for this flow.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="gap-1">
              <Monitor className="h-3 w-3" />
              Browser (text)
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              Phone / Twilio — Studio only
            </Badge>
            <Badge variant="outline">{languageLabel}</Badge>
            <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
              {agent.status ?? 'unknown'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {agentId && token ? (
          <BrowserDemoV1
            agentId={agentId}
            tenantId={tenantId}
            token={token}
            agentWorkflow={agent.workflow}
          />
        ) : null}
        {SHOW_EXPERIMENTAL_REALTIME_DEMO && token ? (
          <VoiceAgentDemoExperimentalPanel agent={agent} tenantId={tenantId} token={token} />
        ) : null}
      </div>
    </div>
  )
}
