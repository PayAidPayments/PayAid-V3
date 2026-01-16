'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Phone, ArrowLeft, Play } from 'lucide-react'
import Link from 'next/link'
import { VoiceCallList } from '@/components/voice-agent/voice-call-list'
import { InitiateCallDialog } from '@/components/voice-agent/initiate-call-dialog'

export default function VoiceAgentCallsPage() {
  const params = useParams()
  const agentId = params.id as string
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCallDialog, setShowCallDialog] = useState(false)

  useEffect(() => {
    fetchCalls()
  }, [agentId])

  const fetchCalls = async () => {
    try {
      const response = await fetch(`/api/v1/voice-agents/${agentId}/calls`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setCalls(data.calls || [])
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
            <Link href="/dashboard/voice-agents">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Agents
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Call History</h1>
            <p className="text-muted-foreground mt-2">
              View and manage voice agent calls
            </p>
          </div>
          <Button onClick={() => setShowCallDialog(true)}>
            <Play className="mr-2 h-4 w-4" />
            Initiate Call
          </Button>
        </div>

        <VoiceCallList calls={calls} loading={loading} onRefresh={fetchCalls} />

        {showCallDialog && (
          <InitiateCallDialog
            agentId={agentId}
            open={showCallDialog}
            onClose={() => setShowCallDialog(false)}
            onSuccess={fetchCalls}
          />
        )}
    </div>
  )
}

