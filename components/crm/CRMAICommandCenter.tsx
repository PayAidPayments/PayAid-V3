'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Zap, ChevronRight, Bot } from 'lucide-react'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { useTerms } from '@/lib/terminology/use-terms'

export interface CRMAICommandCenterStats {
  dealsCreatedThisMonth?: number
  revenueThisMonth?: number
  dealsClosingThisMonth?: number
  overdueTasks?: number
  totalLeads?: number
  activeCustomers?: number
  pipelineByStage?: { stage: string; count: number }[]
}

interface CRMAICommandCenterProps {
  tenantId: string
  stats: CRMAICommandCenterStats | null
  userName?: string
}

export function CRMAICommandCenter({ tenantId, stats, userName }: CRMAICommandCenterProps) {
  const { term, pluralTerm } = useTerms()
  const monthLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  }, [])

  const nextActions = useMemo(() => {
    const actions: { text: string; href: string }[] = []
    const overdueTasks = stats?.overdueTasks ?? 0
    const dealsClosing = stats?.dealsClosingThisMonth ?? 0
    const totalLeads = stats?.totalLeads ?? 0

    if (overdueTasks > 0) {
      actions.push({
        text: `Complete ${overdueTasks} overdue task${overdueTasks !== 1 ? 's' : ''}`,
        href: `/crm/${tenantId}/Tasks?status=overdue`,
      })
    }
    if (dealsClosing > 0) {
      actions.push({
        text: `Review ${dealsClosing} ${dealsClosing !== 1 ? pluralTerm('deal').toLowerCase() : term('deal').toLowerCase()} closing this month`,
        href: `/crm/${tenantId}/Deals`,
      })
    }
    if (totalLeads > 0 && actions.length < 3) {
      actions.push({
        text: `Follow up on ${totalLeads} ${totalLeads !== 1 ? pluralTerm('lead').toLowerCase() : term('lead').toLowerCase()}`,
        href: `/crm/${tenantId}/Leads`,
      })
    }
    if (actions.length === 0) {
      actions.push({ text: `Add new ${pluralTerm('lead').toLowerCase()}`, href: `/crm/${tenantId}/Leads/New` })
      actions.push({ text: `View ${term('pipeline').toLowerCase()}`, href: `/crm/${tenantId}/Deals` })
      actions.push({ text: 'Create tasks', href: `/crm/${tenantId}/Tasks/new` })
    }
    return actions.slice(0, 3)
  }, [tenantId, stats, term, pluralTerm])

  const revenueThisMonth = stats?.revenueThisMonth ?? 0
  const pipelineTotal = (stats?.pipelineByStage || []).reduce((s, p) => s + (p?.count || 0), 0)

  return (
    <Card
      className="border shadow-lg bg-white dark:bg-slate-900 dark:border-slate-700 border-l-4 border-l-indigo-500 dark:border-l-indigo-500"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-indigo-900 dark:text-indigo-100">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            AI Command Center
            <span className="text-sm font-normal text-muted-foreground">
              – {monthLabel}
            </span>
          </CardTitle>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-page-ai'))}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <Bot className="h-3.5 w-3.5" />
            Ask PayAid AI
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 overflow-y-auto px-5 pb-5" style={{ maxHeight: 'calc(100% - 72px)' }}>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {userName ? `Hi ${userName},` : ''} Here are your next best actions.
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Next Best Actions</h3>
          </div>
          <ul className="space-y-2">
            {nextActions.map((action, index) => (
              <li key={index}>
                <Link
                  href={action.href}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-indigo-100 dark:border-indigo-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer group min-w-0"
                >
                  <ChevronRight className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 break-words min-w-0">{action.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 pt-4 border-t border-indigo-100 dark:border-indigo-900">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{`${term('pipeline')} & revenue`}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 min-w-0">
            <span className="break-words min-w-0">Revenue this month: {formatINRForDisplay(revenueThisMonth)}</span>
            <span className="break-words min-w-0 flex-shrink-0">{`${pluralTerm('deal')} in ${term('pipeline').toLowerCase()}: ${pipelineTotal}`}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
