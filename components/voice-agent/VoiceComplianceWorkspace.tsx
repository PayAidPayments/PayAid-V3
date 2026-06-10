'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save, ShieldCheck } from 'lucide-react'
import type { VoiceTenantCompliancePolicyView } from '@/lib/voice-agent/consent-policy'
import { DEFAULT_VOICE_COMPLIANCE_POLICY } from '@/lib/voice-agent/consent-policy'

export function VoiceComplianceWorkspace() {
  const { token } = useAuthStore()
  const [policy, setPolicy] = useState<VoiceTenantCompliancePolicyView>(DEFAULT_VOICE_COMPLIANCE_POLICY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      setError(null)
      const res = await fetch('/api/v1/voice-agents/compliance/policy', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText)
      const data = await res.json()
      setPolicy(data.policy ?? DEFAULT_VOICE_COMPLIANCE_POLICY)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load compliance policy')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    if (!token) return
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/v1/voice-agents/compliance/policy', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policy),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText)
      const data = await res.json()
      setPolicy(data.policy)
      setMessage('Compliance policy saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save policy')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading compliance policy…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ShieldCheck className="h-7 w-7" />
          Compliance &amp; consent
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tenant defaults for recording, transcripts, retention, and export redaction.
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}
      {message && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="py-4 text-sm text-green-800 dark:text-green-200">{message}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recording &amp; transcripts</CardTitle>
          <CardDescription>Applied to browser-live demos and telephony closeout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="recordingRequired">Require call recording</Label>
              <p className="text-xs text-muted-foreground">Sessions without recording are flagged in audit.</p>
            </div>
            <Switch
              id="recordingRequired"
              checked={policy.recordingRequired}
              onCheckedChange={(v) => setPolicy((p) => ({ ...p, recordingRequired: v }))}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="transcriptRequired">Require transcript persistence</Label>
              <p className="text-xs text-muted-foreground">Turn-by-turn transcript stored on session end.</p>
            </div>
            <Switch
              id="transcriptRequired"
              checked={policy.transcriptRequired}
              onCheckedChange={(v) => setPolicy((p) => ({ ...p, transcriptRequired: v }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Consent capture mode</Label>
            <Select
              value={policy.consentMode}
              onValueChange={(v) =>
                setPolicy((p) => ({
                  ...p,
                  consentMode: v as VoiceTenantCompliancePolicyView['consentMode'],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="explicit_toggle">Explicit toggle (demo UI)</SelectItem>
                <SelectItem value="implied_demo">Implied (promoter demo)</SelectItem>
                <SelectItem value="outbound_disclosure">Outbound disclosure (campaigns)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retention &amp; exports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="retentionDays">Recording retention (days)</Label>
            <Input
              id="retentionDays"
              type="number"
              min={1}
              max={3650}
              value={policy.retentionDays}
              onChange={(e) =>
                setPolicy((p) => ({ ...p, retentionDays: Number(e.target.value) || 90 }))
              }
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="redactExports">Redact exports by default</Label>
              <p className="text-xs text-muted-foreground">Inbox export uses ?redact=1 when enabled.</p>
            </div>
            <Switch
              id="redactExports"
              checked={policy.redactExportsByDefault}
              onCheckedChange={(v) => setPolicy((p) => ({ ...p, redactExportsByDefault: v }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outboundDisclosure">Outbound disclosure script</Label>
            <Textarea
              id="outboundDisclosure"
              rows={3}
              value={policy.outboundDisclosureText ?? ''}
              onChange={(e) => setPolicy((p) => ({ ...p, outboundDisclosureText: e.target.value }))}
              placeholder="Played or logged at campaign dial start…"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => void save()} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save policy
      </Button>
    </div>
  )
}
