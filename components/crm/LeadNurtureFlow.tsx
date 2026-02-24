'use client'

/**
 * Phase 1A: AI Lead Nurture — stage + recommended action + predicted revenue (₹ INR).
 * Shows nurture stage (cold/warm/hot), AI nurture_action, and optional rescore with Groq.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, MessageCircle, Target } from 'lucide-react'

const INDIAN_CURRENCY = '₹'

interface NurtureData {
  score?: number
  stage?: 'hot' | 'warm' | 'cold'
  nurture_action?: string
  predicted_mrr?: number
  components?: { groq?: boolean; nurture_action?: string; predicted_mrr_inr?: number }
}

interface LeadNurtureFlowProps {
  contactId: string
  tenantId: string
  /** Pass true to prefer Groq India SMB scoring when fetching */
  useGroq?: boolean
}

export function LeadNurtureFlow({ contactId, tenantId, useGroq = true }: LeadNurtureFlowProps) {
  const queryClient = useQueryClient()
  const [rescoreWithGroq, setRescoreWithGroq] = useState(false)

  const { data, isLoading, refetch } = useQuery<NurtureData>({
    queryKey: ['lead-nurture', contactId, useGroq || rescoreWithGroq],
    queryFn: async () => {
      const url = `/api/leads/score?contactId=${contactId}${useGroq || rescoreWithGroq ? '&useGroq=true' : ''}`
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch nurture data')
      return response.json()
    },
  })

  const mutateRescore = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/leads/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, useGroq: true }),
      })
      if (!response.ok) throw new Error('Rescore failed')
      return response.json()
    },
    onSuccess: () => {
      setRescoreWithGroq(true)
      queryClient.invalidateQueries({ queryKey: ['lead-nurture', contactId] })
      queryClient.invalidateQueries({ queryKey: ['lead-score', contactId] })
    },
  })

  const stage = data?.stage ?? (data?.components as NurtureData['components'])?.groq ? (data?.components as { stage?: string })?.stage : undefined
  const nurtureAction = data?.nurture_action ?? data?.components?.nurture_action
  const predictedMrr = data?.predicted_mrr ?? data?.components?.predicted_mrr_inr
  const score = data?.score

  const stageBadgeVariant = (s: string) => {
    if (s === 'hot') return 'default'
    if (s === 'warm') return 'secondary'
    return 'outline'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Nurture flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Nurture flow
            </CardTitle>
            <CardDescription>AI-recommended next step and predicted revenue (India SMB)</CardDescription>
          </div>
          {stage && (
            <Badge variant={stageBadgeVariant(stage)}>
              {stage}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {nurtureAction && (
          <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3">
            <Target className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Recommended action</p>
              <p className="text-sm text-muted-foreground">{nurtureAction}</p>
            </div>
          </div>
        )}
        {predictedMrr != null && predictedMrr > 0 && (
          <p className="text-sm">
            <span className="text-muted-foreground">Predicted MRR </span>
            <span className="font-medium">{INDIAN_CURRENCY}{Number(predictedMrr).toLocaleString('en-IN')}</span>
          </p>
        )}
        {score != null && (
          <p className="text-xs text-muted-foreground">
            Lead score: {Math.round(score)}/100
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutateRescore.mutate()}
          disabled={mutateRescore.isPending}
        >
          {mutateRescore.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Rescore with AI (Groq)</span>
        </Button>
      </CardContent>
    </Card>
  )
}
