'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Phone, Settings, Trash2, Play, FileText, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

interface VoiceAgent {
  id: string
  name: string
  description?: string
  language: string
  status: string
  createdAt: string
  tenantId?: string
}

interface VoiceAgentListProps {
  agents: VoiceAgent[]
  loading: boolean
  onRefresh: () => void
}

export function VoiceAgentList({ agents, loading, onRefresh }: VoiceAgentListProps) {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || 'tenant'
  const { token } = useAuthStore()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return

    if (!token) {
      console.error('No token available for delete request')
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/v1/voice-agents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        onRefresh()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete agent' }))
        alert(errorData.error || 'Failed to delete agent')
      }
    } catch (error) {
      console.error('Failed to delete agent:', error)
      alert('Failed to delete agent. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-muted-foreground">Loading agents...</p>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Phone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No voice agents yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first voice agent to start making automated calls
          </p>
          <div className="space-y-2">
            <Link href={`/voice-agents/${tenantId}/New`}>
              <Button>Create Agent</Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-4">
              If you expected to see agents here, check the browser console (F12) for debugging information.
              <br />
              The agents might belong to a different tenant.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {agents.map((agent) => (
        <Card key={agent.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {agent.name}
                  <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                    {agent.status}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  {agent.description || 'No description'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Link href={`/voice-agents/${tenantId}/Demo?agentId=${agent.id}`}>
                  <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Demo
                  </Button>
                </Link>
                <Link href={`/voice-agents/${tenantId}/Calls?agentId=${agent.id}`}>
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Calls
                  </Button>
                </Link>
                <Link href={`/voice-agents/${tenantId}/Settings?agentId=${agent.id}`}>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(agent.id)}
                  disabled={deleting === agent.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Language: {agent.language.toUpperCase()}</span>
              <span>Created: {new Date(agent.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

