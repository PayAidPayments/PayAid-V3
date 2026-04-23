'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Activity, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react'
import { useTerms } from '@/lib/terminology/use-terms'

type RiskFactor = {
  key: string
  label: string
  impact: 'positive' | 'negative' | 'neutral'
  detail: string
}

type DealHealth = {
  deal_id: string
  deal_name: string
  stage: string
  value: number
  probability: number
  health_score: number
  health_label: 'healthy' | 'moderate' | 'at_risk' | 'critical'
  risk_factors: RiskFactor[]
  computed_at: string
}

function scoreColor(label: string) {
  if (label === 'healthy') return 'text-emerald-600 dark:text-emerald-400'
  if (label === 'moderate') return 'text-amber-600 dark:text-amber-400'
  if (label === 'at_risk') return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

function scoreBg(label: string) {
  if (label === 'healthy') return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
  if (label === 'moderate') return 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
  if (label === 'at_risk') return 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800'
  return 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
}

function HealthIcon({ label }: { label: string }) {
  if (label === 'healthy') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
  if (label === 'moderate') return <Activity className="w-5 h-5 text-amber-500" />
  if (label === 'at_risk') return <AlertTriangle className="w-5 h-5 text-orange-500" />
  return <TrendingDown className="w-5 h-5 text-red-500" />
}

export function DealHealthCard({ dealId, tenantId }: { dealId: string; tenantId: string }) {
  const { term } = useTerms()
  const { data, isLoading, isError } = useQuery<DealHealth | null>({
    queryKey: ['deal-health', dealId, tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/revenue/deal-health/${dealId}`, {
        headers: getAuthHeaders(),
      })
      if (res.status === 403) return null
      if (res.status === 404) return null
      if (!res.ok) throw new Error('Failed to load deal health')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  if (isLoading) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm dark:text-gray-100 flex items-center gap-2">
            <Activity className="w-4 h-4" /> {`${term('deal')} Health`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-gray-700" />
        </CardContent>
      </Card>
    )
  }

  if (isError || data === null) {
    return null
  }

  const positiveFactors = data.risk_factors.filter((f) => f.impact === 'positive')
  const negativeFactors = data.risk_factors.filter((f) => f.impact === 'negative')

  return (
    <Card className={`border ${scoreBg(data.health_label)}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-slate-800 dark:text-gray-100">
          <HealthIcon label={data.health_label} />
          {`${term('deal')} Health Score`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end gap-3">
          <span className={`text-4xl font-bold tabular-nums ${scoreColor(data.health_label)}`}>
            {data.health_score}
          </span>
          <div className="pb-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${scoreColor(data.health_label)}`}
            >
              {data.health_label?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <div className="h-2 rounded-full bg-slate-200 dark:bg-gray-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              data.health_label === 'healthy'
                ? 'bg-emerald-500'
                : data.health_label === 'moderate'
                  ? 'bg-amber-500'
                  : data.health_label === 'at_risk'
                    ? 'bg-orange-500'
                    : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(data.health_score, 3)}%` }}
          />
        </div>

        {negativeFactors.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
              Risk signals
            </p>
            {negativeFactors.map((f) => (
              <div key={f.key} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-gray-300">
                <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                <span>{f.detail}</span>
              </div>
            ))}
          </div>
        )}

        {positiveFactors.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
              Positive signals
            </p>
            {positiveFactors.map((f) => (
              <div key={f.key} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-gray-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                <span>{f.detail}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-slate-400 dark:text-gray-500">
          Computed {new Date(data.computed_at).toLocaleTimeString()} · Revenue Intelligence
        </p>
      </CardContent>
    </Card>
  )
}
