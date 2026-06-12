'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type VoiceCollectionsTouch = {
  at?: string
  summary?: string
  disposition?: string
  promiseToPay?: boolean
  followupDueAt?: string
  voiceCallId?: string
  voiceSessionId?: string
}

function readCollectionsTouch(metadata: unknown): VoiceCollectionsTouch | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null
  const touch = (metadata as Record<string, unknown>).lastVoiceCollectionsTouch
  if (!touch || typeof touch !== 'object' || Array.isArray(touch)) return null
  const row = touch as Record<string, unknown>
  return {
    at: typeof row.at === 'string' ? row.at : undefined,
    summary: typeof row.summary === 'string' ? row.summary : undefined,
    disposition: typeof row.disposition === 'string' ? row.disposition : undefined,
    promiseToPay: row.promiseToPay === true,
    followupDueAt: typeof row.followupDueAt === 'string' ? row.followupDueAt : undefined,
    voiceCallId: typeof row.voiceCallId === 'string' ? row.voiceCallId : undefined,
    voiceSessionId: typeof row.voiceSessionId === 'string' ? row.voiceSessionId : undefined,
  }
}

export function VoiceFinanceCollectionsPanel({ metadata }: { metadata?: unknown }) {
  const touch = readCollectionsTouch(metadata)
  if (!touch) return null

  return (
    <Card className="border-violet-200 bg-violet-50/40 dark:border-violet-900 dark:bg-violet-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Voice collections update</CardTitle>
        <CardDescription>Latest outcome from Voice Agents finance bundle</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {touch.at ? <p className="text-muted-foreground">Recorded {new Date(touch.at).toLocaleString()}</p> : null}
        {touch.disposition ? <p><span className="font-medium">Disposition:</span> {touch.disposition}</p> : null}
        {touch.summary ? <p className="text-gray-700 dark:text-gray-300">{touch.summary}</p> : null}
        {touch.promiseToPay ? (
          <p className="font-medium text-violet-700 dark:text-violet-300">
            Promise to pay
            {touch.followupDueAt ? ` — follow up by ${new Date(touch.followupDueAt).toLocaleDateString()}` : ''}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
