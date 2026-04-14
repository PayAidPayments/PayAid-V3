'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, MessageSquare, PhoneCall, Share2 } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'

const integrationCards = [
  {
    id: 'email',
    title: 'Email (SMTP)',
    description: 'Configure SMTP for outbound emails and test delivery.',
    icon: Mail,
    hrefSuffix: '/Integrations/Email',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp (WAHA)',
    description: 'Connect your WAHA server and verify session health.',
    icon: MessageSquare,
    hrefSuffix: '/Integrations/WhatsApp',
  },
  {
    id: 'telephony',
    title: 'Telephony',
    description: 'Configure Exotel/Twilio credentials, caller IDs, and webhooks.',
    icon: PhoneCall,
    hrefSuffix: '/Integrations/Telephony',
  },
  {
    id: 'social',
    title: 'Social media',
    description: 'Connect LinkedIn/Facebook/Instagram and manage publish permissions.',
    icon: Share2,
    hrefSuffix: '/Integrations/Social',
  },
] as const

type IntegrationHealthData = {
  email: { configured: boolean; oauthConnectedCount: number }
  whatsapp: { configured: boolean; connected: boolean; lastEventAt: string | null }
  telephony: { configured: boolean; provider: string | null; lastWebhookAt: string | null }
  social: { connectedCount: number; lastCheckedAt: string | null }
  summary: { totalConfigured: number; totalConnected: number; overall: 'healthy' | 'attention' }
}

type IntegrationAlertsData = {
  alerts: Array<{
    code: string
    severity: 'high' | 'medium' | 'low'
    title: string
    message: string
    source: string
    occurredAt: string
  }>
  summary: { total: number; high: number; medium: number; low: number }
  generatedAt: string
}

type IntegrationDiagnosticsData = {
  modules: Array<{
    id: 'email' | 'whatsapp' | 'telephony' | 'social'
    title: string
    status: 'ok' | 'warning'
    checks: Array<{
      key: string
      label: string
      status: 'ok' | 'warning'
      detail: string
    }>
    nextActions: string[]
  }>
  generatedAt: string
}

type IntegrationSlaData = {
  window_days: number
  summary: {
    average_uptime_pct: number
    total_success_events: number
    total_failure_events: number
  }
  modules: Array<{
    key: 'smtp' | 'waha' | 'telephony' | 'social'
    label: string
    success_count: number
    failure_count: number
    uptime_pct: number
    mttr_minutes: number | null
  }>
  generated_at: string
}

function authHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function IntegrationsSettingsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [slaWindowDays, setSlaWindowDays] = useState<7 | 30 | 90>(30)

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['settings', 'integrations', 'health', tenantId],
    queryFn: async () => {
      const [smtpRes, oauthRes, wahaRes, telephonyRes, socialRes] = await Promise.all([
        fetch('/api/settings/smtp', { headers: authHeaders() }),
        fetch('/api/settings/email/oauth/status', { headers: authHeaders() }),
        fetch('/api/settings/waha', { headers: authHeaders() }),
        fetch('/api/settings/telephony', { headers: authHeaders() }),
        fetch('/api/settings/social', { headers: authHeaders() }),
      ])

      const [smtp, oauth, waha, telephony, social] = await Promise.all([
        smtpRes.json().catch(() => ({})),
        oauthRes.json().catch(() => ({ providers: [] })),
        wahaRes.json().catch(() => ({})),
        telephonyRes.json().catch(() => ({})),
        socialRes.json().catch(() => ({ providers: [] })),
      ])

      const oauthConnectedCount = Array.isArray((oauth as any)?.providers)
        ? (oauth as any).providers.filter((p: any) => p?.connected).length
        : 0
      const socialConnectedCount = Array.isArray((social as any)?.providers)
        ? (social as any).providers.filter((p: any) => p?.connected).length
        : 0

      const configuredFlags = [
        Boolean((smtp as any)?.isConfigured),
        Boolean((waha as any)?.isConfigured),
        Boolean((telephony as any)?.isConfigured),
        socialConnectedCount > 0 || oauthConnectedCount > 0,
      ]
      const totalConfigured = configuredFlags.filter(Boolean).length
      const totalConnected =
        oauthConnectedCount +
        socialConnectedCount +
        (Boolean((waha as any)?.operationalConnected) ? 1 : 0) +
        (Boolean((telephony as any)?.lastWebhookAt) ? 1 : 0)

      return {
        email: {
          configured: Boolean((smtp as any)?.isConfigured),
          oauthConnectedCount,
        },
        whatsapp: {
          configured: Boolean((waha as any)?.isConfigured),
          connected: Boolean((waha as any)?.operationalConnected),
          lastEventAt: (waha as any)?.lastEventAt ?? null,
        },
        telephony: {
          configured: Boolean((telephony as any)?.isConfigured),
          provider: (telephony as any)?.provider ?? null,
          lastWebhookAt: (telephony as any)?.lastWebhookAt ?? null,
        },
        social: {
          connectedCount: socialConnectedCount,
          lastCheckedAt: (social as any)?.lastCheckedAt ?? null,
        },
        summary: {
          totalConfigured,
          totalConnected,
          overall: totalConfigured >= 3 ? 'healthy' : 'attention',
        },
      } satisfies IntegrationHealthData
    },
    enabled: Boolean(tenantId),
    retry: false,
  })

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['settings', 'integrations', 'alerts', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/settings/integrations/alerts', { headers: authHeaders() })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || 'Failed to load integration alerts')
      return json as IntegrationAlertsData
    },
    enabled: Boolean(tenantId),
    retry: false,
  })

  const { data: diagnostics, isLoading: diagnosticsLoading } = useQuery({
    queryKey: ['settings', 'integrations', 'diagnostics', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/settings/integrations/diagnostics', { headers: authHeaders() })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || 'Failed to load integration diagnostics')
      return json as IntegrationDiagnosticsData
    },
    enabled: Boolean(tenantId),
    retry: false,
  })

  const { data: sla, isLoading: slaLoading } = useQuery({
    queryKey: ['settings', 'integrations', 'sla', tenantId, slaWindowDays],
    queryFn: async () => {
      const res = await fetch(`/api/settings/integrations/sla?window_days=${slaWindowDays}`, { headers: authHeaders() })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || 'Failed to load integration SLA metrics')
      return json as IntegrationSlaData
    },
    enabled: Boolean(tenantId),
    retry: false,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Integrations</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Configure connectivity and credentials for external services.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Email health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {healthLoading ? '...' : health?.email.configured ? 'Configured' : 'Pending'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              OAuth connected: {healthLoading ? '...' : health?.email.oauthConnectedCount ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-slate-500">WhatsApp health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {healthLoading ? '...' : health?.whatsapp.connected ? 'Connected' : 'Disconnected'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Last event: {healthLoading ? '...' : health?.whatsapp.lastEventAt || '—'}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Telephony health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {healthLoading ? '...' : health?.telephony.provider || 'Not set'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Webhook: {healthLoading ? '...' : health?.telephony.lastWebhookAt || '—'}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Overall readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {healthLoading ? '...' : health?.summary.totalConfigured || 0}/4
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Connected signals: {healthLoading ? '...' : health?.summary.totalConnected || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Integration incident alerts</CardTitle>
          <CardDescription>
            {alertsLoading
              ? 'Loading alerts...'
              : `${alerts?.summary.total ?? 0} active alert(s) - High: ${alerts?.summary.high ?? 0}, Medium: ${alerts?.summary.medium ?? 0}, Low: ${alerts?.summary.low ?? 0}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!alertsLoading && (alerts?.alerts.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-100">
              No active integration incidents detected.
            </div>
          ) : null}
          {(alerts?.alerts ?? []).slice(0, 5).map((alert) => (
            <div
              key={`${alert.code}-${alert.source}-${alert.occurredAt}`}
              className={`rounded-xl border px-3 py-2 text-sm ${
                alert.severity === 'high'
                  ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-100'
                  : alert.severity === 'medium'
                  ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-100'
                  : 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200'
              }`}
            >
              <div className="font-medium">{alert.title}</div>
              <div>{alert.message}</div>
              <div className="text-xs opacity-80 mt-1">
                Source: {alert.source} - {new Date(alert.occurredAt).toLocaleString()}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Guided diagnostics and fixes</CardTitle>
          <CardDescription>
            {diagnosticsLoading
              ? 'Analyzing integration health...'
              : `Diagnostics across ${diagnostics?.modules.length ?? 0} module(s).`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(diagnostics?.modules ?? []).map((module) => (
            <div key={module.id} className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{module.title}</div>
                <div
                  className={`text-xs px-2 py-1 rounded-full ${
                    module.status === 'ok'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                  }`}
                >
                  {module.status === 'ok' ? 'Healthy' : 'Needs attention'}
                </div>
              </div>
              <div className="mt-2 space-y-1">
                {module.checks.map((check) => (
                  <div key={check.key} className="text-xs text-slate-600 dark:text-slate-300">
                    <span className={check.status === 'ok' ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}>
                      {check.status === 'ok' ? 'OK' : 'WARN'}
                    </span>{' '}
                    <span className="font-medium">{check.label}:</span> {check.detail}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/settings/${encodeURIComponent(tenantId)}/Integrations/${module.id === 'email' ? 'Email' : module.id === 'whatsapp' ? 'WhatsApp' : module.id === 'telephony' ? 'Telephony' : 'Social'}`}>
                    Open {module.title.split(' ')[0]} settings
                  </Link>
                </Button>
                {module.nextActions.slice(0, 1).map((action, idx) => (
                  <span key={`${module.id}-a-${idx}`} className="text-xs text-slate-500 dark:text-slate-400">
                    Next: {action}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {!diagnosticsLoading && (diagnostics?.modules.length ?? 0) === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">No diagnostics available.</div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Integration SLA dashboard</CardTitle>
          <CardDescription>
            {slaLoading
              ? 'Loading SLA metrics...'
              : `${sla?.summary.average_uptime_pct ?? 100}% avg uptime · ${sla?.summary.total_failure_events ?? 0} failures`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            {[7, 30, 90].map((d) => (
              <Button
                key={`sla-${d}`}
                size="sm"
                variant={slaWindowDays === d ? 'default' : 'outline'}
                onClick={() => setSlaWindowDays(d as 7 | 30 | 90)}
              >
                {d}d
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(sla?.modules ?? []).map((m) => (
              <div key={`sla-${m.key}`} className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{m.label}</div>
                  <div className={`text-xs px-2 py-1 rounded-full ${m.uptime_pct >= 95 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'}`}>
                    {m.uptime_pct}% uptime
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                  Success: {m.success_count} · Failures: {m.failure_count}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  MTTR: {m.mttr_minutes == null ? 'N/A' : `${m.mttr_minutes} min`}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrationCards.map((c) => {
          const Icon = c.icon
          const href = `/settings/${encodeURIComponent(tenantId)}${c.hrefSuffix}`
          return (
            <Card key={c.id} className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-slate-100">
                  <Icon className="h-4 w-4" />
                  {c.title}
                </CardTitle>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to configure
                </div>
                <Button variant="outline" asChild>
                  <Link href={href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

