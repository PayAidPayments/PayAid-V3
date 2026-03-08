'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Phone, Trash2, Headphones, Pencil, FileText, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface VoiceAgentWithStats {
  id: string
  name: string
  description?: string
  language: string
  status: string
  createdAt: string
  tenantId?: string
  callCount?: number
  conversionRate?: number
  totalMinutes?: number
}

interface VoiceAgentTableProps {
  agents: VoiceAgentWithStats[]
  loading: boolean
  onRefresh: () => void
}

export function VoiceAgentTable({ agents, loading, onRefresh }: VoiceAgentTableProps) {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || 'tenant'
  const { token } = useAuthStore()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return
    if (!token) return
    setDeleting(id)
    try {
      const response = await fetch(`/api/v1/voice-agents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) onRefresh()
      else {
        const data = await response.json().catch(() => ({}))
        alert(data.error || 'Failed to delete agent')
      }
    } catch (e) {
      console.error(e)
      alert('Failed to delete agent. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const langLabel = (lang: string) => {
    const m: Record<string, string> = {
      hi: 'Hindi',
      'hi-IN': 'Hindi',
      en: 'English',
      'en-IN': 'English',
      ta: 'Tamil',
      te: 'Telugu',
      kn: 'Kannada',
      mr: 'Marathi',
    }
    return m[lang] || lang
  }

  if (loading) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p className="text-muted-foreground">Loading agents...</p>
      </div>
    )
  }

  const handleSeedDemo = async () => {
    if (!token) return
    setSeeding(true)
    try {
      const res = await fetch('/api/v1/voice-agents/seed-demo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        onRefresh()
      } else {
        alert(data.error || 'Failed to create demo agents')
      }
    } catch (e) {
      console.error(e)
      alert('Failed to create demo agents. Please try again.')
    } finally {
      setSeeding(false)
    }
  }

  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Phone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No voice agents yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Create your first voice agent to start making automated calls, or add demo agents (Ravi, Priya, Survey) to try the flow.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href={`/voice-agents/${tenantId}/create`}>
              <Button>Create Agent</Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleSeedDemo}
              disabled={seeding}
            >
              {seeding ? (
                <>
                  <span className="animate-spin mr-2 inline-block size-4 rounded-full border-2 border-current border-t-transparent" />
              Creating…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
              Create demo agents
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent Name</TableHead>
              <TableHead>Language</TableHead>
              <TableHead className="text-right">Calls</TableHead>
              <TableHead className="text-right">Conv%</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{agent.name}</span>
                    <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {agent.status}
                    </Badge>
                  </div>
                  {agent.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                      {agent.description}
                    </p>
                  )}
                </TableCell>
                <TableCell>{langLabel(agent.language)}</TableCell>
                <TableCell className="text-right">{agent.callCount ?? 0}</TableCell>
                <TableCell className="text-right">{agent.conversionRate ?? 0}%</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/voice-agents/${tenantId}/studio?agentId=${agent.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/voice-agents/${tenantId}/Demo?agentId=${agent.id}`}>
                      <Button
                        variant="default"
                        size="icon"
                        className="h-8 w-8 bg-green-600 hover:bg-green-700"
                        title="Test Demo"
                      >
                        <Headphones className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/voice-agents/${tenantId}/Calls?agentId=${agent.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Logs">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      title="Delete"
                      onClick={() => handleDelete(agent.id)}
                      disabled={deleting === agent.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
