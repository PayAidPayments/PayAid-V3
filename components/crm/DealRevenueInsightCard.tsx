'use client'

import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import { formatINRStandard } from '@/lib/utils/formatINR'

type Rec = {
  id: string
  deal_id: string
  deal_name: string
  stage: string
  value_inr: number
  risk_score: number
  recommendation_rationale: string
  suggested_action: string
}

/**
 * When this open deal appears in GET /api/v1/revenue/insights/next-actions, show rationale + accept/reject.
 */
export function DealRevenueInsightCard({
  dealId,
  tenantId,
  stage,
}: {
  dealId: string
  tenantId: string
  stage: string
}) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['revenue-next-actions', tenantId, 'deal', dealId],
    queryFn: async () => {
      const res = await apiRequest('/api/v1/revenue/insights/next-actions?limit=30')
      if (!res.ok) return { recommendations: [] as Rec[] }
      return res.json() as Promise<{ recommendations: Rec[] }>
    },
    enabled: !!tenantId && !!dealId && stage !== 'won' && stage !== 'lost',
  })

  const feedbackMutation = useMutation({
    mutationFn: async (payload: { recommendation_id: string; accepted: boolean; idempotencyKey: string }) => {
      const res = await apiRequest('/api/v1/revenue/feedback', {
        method: 'POST',
        headers: { 'x-idempotency-key': payload.idempotencyKey },
        body: JSON.stringify({
          recommendation_id: payload.recommendation_id,
          deal_id: dealId,
          accepted: payload.accepted,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Could not record feedback')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-next-actions', tenantId] })
    },
  })

  if (stage === 'won' || stage === 'lost') return null

  const rec = data?.recommendations?.find((r) => r.deal_id === dealId)
  if (isLoading) {
    return (
      <Card className="dark:bg-slate-900 dark:border-slate-800 border-slate-200/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Revenue insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500">Loading…</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !rec) return null

  const runFeedback = (accepted: boolean) => {
    const idem =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? `deal:${dealId}:revenue:${accepted ? 'accept' : 'reject'}:${crypto.randomUUID()}`
        : `deal:${dealId}:${Date.now()}`
    feedbackMutation.mutate({ recommendation_id: rec.id, accepted, idempotencyKey: idem })
  }

  return (
    <Card className="dark:bg-slate-900 dark:border-slate-800 border-slate-200/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Revenue insight
        </CardTitle>
        <CardDescription className="text-xs">
          From Revenue Intelligence ranking ·{' '}
          <Link href={`/crm/${tenantId}/Revenue-Intelligence`} className="underline font-medium text-slate-600 dark:text-slate-300">
            Open dashboard
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-700 dark:text-slate-200">{rec.recommendation_rationale}</p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Risk {Math.round(rec.risk_score * 100)}%</span>
          <span>·</span>
          <span className="capitalize">{rec.suggested_action.replace(/_/g, ' ')}</span>
          <span>·</span>
          <span>{formatINRStandard(rec.value_inr)}</span>
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={feedbackMutation.isPending}
            title={feedbackMutation.isPending ? 'Please wait' : 'Reject suggestion'}
            onClick={() => runFeedback(false)}
          >
            Reject
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={feedbackMutation.isPending}
            title={feedbackMutation.isPending ? 'Please wait' : 'Accept suggestion'}
            onClick={() => runFeedback(true)}
          >
            {feedbackMutation.isPending ? 'Saving…' : 'Accept'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
