'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, Play } from 'lucide-react'
import Link from 'next/link'

const VoiceCallList = dynamic(
  () =>
    import('@/components/voice-agent/voice-call-list').then((m) => ({
      default: m.VoiceCallList,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
  }
)

const InitiateCallDialog = dynamic(
  () =>
    import('@/components/voice-agent/initiate-call-dialog').then((m) => ({
      default: m.InitiateCallDialog,
    })),
  { ssr: false }
)

export function VoiceCallsWorkspace() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCallDialog, setShowCallDialog] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  useEffect(() => {
    fetchCalls()
  }, [])

  const fetchCalls = async () => {
    try {
      const agentsResponse = await fetch('/api/v1/voice-agents', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json()
        const agents = agentsData.agents || []

        const allCalls: any[] = []
        for (const agent of agents) {
          const callsResponse = await fetch(`/api/v1/voice-agents/${agent.id}/calls`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          })
          if (callsResponse.ok) {
            const callsData = await callsResponse.json()
            allCalls.push(...(callsData.calls || []))
          }
        }
        setCalls(allCalls)
      }
    } catch (error) {
      console.error('Failed to fetch calls:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/voice-agents/${tenantId}/Home`}>
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Call History</h1>
          <p className="text-muted-foreground mt-2">View and manage voice agent calls</p>
        </div>
        <Button onClick={() => setShowCallDialog(true)}>
          <Play className="mr-2 h-4 w-4" />
          Initiate Call
        </Button>
      </div>

      <VoiceCallList calls={calls} loading={loading} onRefresh={fetchCalls} />

      {showCallDialog && selectedAgentId && (
        <InitiateCallDialog
          agentId={selectedAgentId}
          open={showCallDialog}
          onClose={() => {
            setShowCallDialog(false)
            setSelectedAgentId(null)
          }}
          onSuccess={fetchCalls}
        />
      )}
    </div>
  )
}
