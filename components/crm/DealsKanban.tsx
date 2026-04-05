'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { format } from 'date-fns'
import { useDeals } from '@/lib/hooks/use-api'
import { PageLoading } from '@/components/ui/loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STAGE_ORDER = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

type DealRow = {
  id: string
  name?: string | null
  stage?: string | null
  value?: number | null
  expectedCloseDate?: string | Date | null
}

export function DealsKanban({ tenantId }: { tenantId: string }) {
  const { data, isLoading, error } = useDeals({ tenantId, limit: 500 })

  const columns = useMemo(() => {
    const deals: DealRow[] = Array.isArray(data?.deals) ? data.deals : []
    const byStage = new Map<string, DealRow[]>()
    for (const d of deals) {
      const stage = String(d.stage || 'lead').toLowerCase()
      if (!byStage.has(stage)) byStage.set(stage, [])
      byStage.get(stage)!.push(d)
    }
    const ordered: { stage: string; deals: DealRow[] }[] = []
    for (const s of STAGE_ORDER) {
      const list = byStage.get(s)
      if (list?.length) {
        ordered.push({ stage: s, deals: list })
        byStage.delete(s)
      }
    }
    for (const [stage, ds] of byStage) {
      ordered.push({ stage, deals: ds })
    }
    return ordered
  }, [data?.deals])

  if (isLoading) {
    return <PageLoading message="Loading board…" fullScreen={false} />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-red-600 dark:text-red-400">
          Could not load deals for the board.
        </CardContent>
      </Card>
    )
  }

  if (columns.length === 0) {
    return (
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <CardContent className="py-12 text-center text-slate-600 dark:text-slate-400">
          No deals yet. Create a deal to populate the pipeline board.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(({ stage, deals }) => (
        <div key={stage} className="min-w-[280px] shrink-0">
          <Card className="h-full border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-semibold">
                {STAGE_LABELS[stage] ?? stage} ({deals.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {deals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/crm/${tenantId}/Deals/${deal.id}`}
                  className="block rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 p-3 hover:shadow-md hover:-translate-y-px transition-all"
                >
                  <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {deal.name || 'Untitled deal'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    ₹{Number(deal.value ?? 0).toLocaleString('en-IN')}
                  </p>
                  {deal.expectedCloseDate && (
                    <p className="text-xs text-slate-500 mt-1">
                      {format(new Date(deal.expectedCloseDate), 'MMM d, yyyy')}
                    </p>
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
