'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { VoiceSupportCasePanel } from '@/components/voice-agent/VoiceSupportCasePanel'

type VoiceLinkRow = {
  id: string
  entityType: string
  entityId: string
  createdAt: string
  metadataJson?: Record<string, unknown> | null
}

export default function CrmVoiceSupportOutcomesPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const [caseLinks, setCaseLinks] = useState<VoiceLinkRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    let cancelled = false
    fetch(`/api/crm/voice-bundle-outcomes?entityType=case&limit=20`, { credentials: 'include' })
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return
        setCaseLinks(Array.isArray(body.links) ? body.links : [])
      })
      .catch(() => {
        if (!cancelled) setCaseLinks([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tenantId])

  const featuredCaseId = caseLinks[0]?.entityId

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Voice support outcomes</h1>
        <p className="text-sm text-muted-foreground">
          Recent support-case updates written by Voice Agents post-call bundles.
        </p>
      </div>

      {featuredCaseId ? (
        <VoiceSupportCasePanel
          tenantId={tenantId}
          caseId={featuredCaseId}
          apiBase="/api/crm/voice-bundle-outcomes"
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent case links</CardTitle>
          <CardDescription>Voice ↔ support case bundle references</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : caseLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No voice support bundle outcomes yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {caseLinks.map((link) => {
                const meta = link.metadataJson ?? {}
                return (
                  <li key={link.id} className="rounded-lg border p-3">
                    <p className="font-medium">Case {link.entityId}</p>
                    <p className="text-muted-foreground">{new Date(link.createdAt).toLocaleString()}</p>
                    {typeof meta.summary === 'string' ? <p className="mt-1">{meta.summary}</p> : null}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
