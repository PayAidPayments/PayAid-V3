'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Inbox, Loader2, RefreshCw } from 'lucide-react'

type InboxItem = {
  sessionId: string
  agentId: string
  agentName?: string
  endedAt?: string
  callerPhone?: string
  routing: string
  disposition?: string
  summary?: string
  sentiment?: string
  objectionTags: string[]
  turnCount?: number
}

export function VoiceInboxWorkspace() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      setError(null)
      const res = await fetch('/api/v1/voice-agents/inbox?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText)
      const data = await res.json()
      setItems(data.items ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inbox')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const exportJson = async () => {
    if (!token) return
    const res = await fetch('/api/v1/voice-agents/inbox/export?limit=100', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voice-inbox-${tenantId}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading voice inbox…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Inbox className="h-7 w-7" />
            Voice Inbox
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Calls without CRM writeback — standalone voice or demo mode (`no_crm_inbox`).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => void exportJson()}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Inbox queue ({items.length})</CardTitle>
          <CardDescription>Ended sessions routed away from CRM lead creation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inbox items yet.</p>
          ) : (
            items.map((item) => (
              <div
                key={item.sessionId}
                className="rounded-lg border p-4 space-y-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{item.routing}</Badge>
                  {item.sentiment && <Badge variant="outline">{item.sentiment}</Badge>}
                  {item.objectionTags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="font-medium">{item.agentName ?? item.agentId}</p>
                {item.callerPhone && (
                  <p className="text-muted-foreground">Caller: {item.callerPhone}</p>
                )}
                {item.summary && <p className="text-muted-foreground line-clamp-2">{item.summary}</p>}
                <p className="text-xs text-muted-foreground">
                  {item.endedAt ? new Date(item.endedAt).toLocaleString() : '—'}
                  {item.turnCount != null ? ` · ${item.turnCount} turns` : ''}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
