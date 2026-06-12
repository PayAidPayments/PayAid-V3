'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type VoiceCaseLink = {
  id: string
  entityId: string
  createdAt: string
  metadataJson?: {
    bundle?: string
    summary?: string
    disposition?: string
    resolutionStatus?: string
    escalationReason?: string
    at?: string
  } | null
}

export function VoiceSupportCasePanel({
  tenantId,
  caseId,
  apiBase = '/api/v1/voice-agents/crm-links',
}: {
  tenantId: string
  caseId: string
  apiBase?: string
}) {
  const [links, setLinks] = useState<VoiceCaseLink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const url = new URL(apiBase, window.location.origin)
    url.searchParams.set('entityType', 'case')
    url.searchParams.set('entityId', caseId)
    url.searchParams.set('limit', '5')

    fetch(url.toString(), { credentials: 'include' })
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return
        setLinks(Array.isArray(body.links) ? body.links : [])
      })
      .catch(() => {
        if (!cancelled) setLinks([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [apiBase, caseId, tenantId])

  if (loading || links.length === 0) return null

  const latest = links[0]
  const meta = latest.metadataJson ?? {}

  return (
    <Card className="border-sky-200 bg-sky-50/40 dark:border-sky-900 dark:bg-sky-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Voice support update</CardTitle>
        <CardDescription>Case {caseId} — Voice Agents bundle</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">
          Linked {new Date(latest.createdAt).toLocaleString()}
        </p>
        {meta.resolutionStatus ? (
          <p><span className="font-medium">Status:</span> {meta.resolutionStatus}</p>
        ) : null}
        {meta.escalationReason ? (
          <p><span className="font-medium">Escalation:</span> {meta.escalationReason}</p>
        ) : null}
        {meta.summary ? <p className="text-gray-700 dark:text-gray-300">{meta.summary}</p> : null}
        {links.length > 1 ? (
          <p className="text-xs text-muted-foreground">{links.length} voice links on this case</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
