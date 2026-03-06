'use client'

import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { Bot, RefreshCcw, MessageSquare } from 'lucide-react'

function getAuthHeaders(token: string | null) {
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function SettingsAIUsagePage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()

  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['ai-usage-summary', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/ai/usage', { headers: getAuthHeaders(token) })
      if (!res.ok) throw new Error('Failed to load usage')
      return res.json() as Promise<{
        month: string
        usage: Record<string, { count: number; tokens: number }>
        total: { count: number; tokens: number }
      }>
    },
    enabled: Boolean(tenantId && token),
  })

  const { data: recentData, isLoading: recentLoading, refetch: refetchRecent } = useQuery({
    queryKey: ['ai-usage-recent', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/ai/usage?recent=50', { headers: getAuthHeaders(token) })
      if (!res.ok) throw new Error('Failed to load recent usage')
      return res.json() as Promise<{
        recent: Array<{
          id: string
          service: string
          requestType: string | null
          modelUsed: string | null
          tokens: number | null
          createdAt: string
        }>
      }>
    },
    enabled: Boolean(tenantId && token),
  })

  const refetch = () => {
    refetchSummary()
    refetchRecent()
  }

  const usage = summaryData?.usage ?? {}
  const total = summaryData?.total ?? { count: 0, tokens: 0 }
  const recent = recentData?.recent ?? []

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">AI Usage</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Co-founder chats and other AI requests. Summary for this month and recent activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <MessageSquare className="w-4 h-4" />
              This month ({summaryData?.month ?? '—'})
            </CardTitle>
            <CardDescription>Total AI requests and tokens</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Requests</span>
                  <span className="font-semibold">{total.count}</span>
                </div>
                {total.tokens > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Tokens</span>
                    <span className="font-semibold">{total.tokens.toLocaleString()}</span>
                  </div>
                )}
                {Object.keys(usage).length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">By service</div>
                    {Object.entries(usage).map(([svc, v]) => (
                      <div key={svc} className="flex justify-between text-xs">
                        <span>{svc}</span>
                        <span>{v.count} requests{v.tokens ? `, ${v.tokens.toLocaleString()} tokens` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Bot className="w-4 h-4" />
              Co-founder
            </CardTitle>
            <CardDescription>AI Co-founder chat usage</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {usage.cofounder ? (
                  <>{(usage as Record<string, { count: number }>).cofounder.count} chats this month.</>
                ) : (
                  <>No Co-founder chats recorded this month.</>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Recent activity</CardTitle>
          <CardDescription>Last 50 AI requests (Co-founder and other services)</CardDescription>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={refetch} disabled={summaryLoading || recentLoading}>
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-4 py-2 font-semibold text-slate-700 dark:text-slate-300">Time</th>
                    <th className="text-left px-4 py-2 font-semibold text-slate-700 dark:text-slate-300">Service</th>
                    <th className="text-left px-4 py-2 font-semibold text-slate-700 dark:text-slate-300">Type</th>
                    <th className="text-left px-4 py-2 font-semibold text-slate-700 dark:text-slate-300">Model</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                        {new Date(r.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2">{r.service}</td>
                      <td className="px-4 py-2">{r.requestType ?? '—'}</td>
                      <td className="px-4 py-2">{r.modelUsed ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
