'use client'

import { BarChart3, CheckCircle2, Clock, Send, Users, XCircle } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import type { CampaignDetailPayload } from '@/lib/marketing/campaign-detail-payload'

export function CampaignKpiGrid({ payload }: { payload: CampaignDetailPayload }) {
  const { summary, campaign } = payload
  const deliveryRate =
    summary.sentCount > 0 ? `${((summary.deliveredCount / summary.sentCount) * 100).toFixed(1)}% delivery` : 'No sends yet'

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
      data-testid="campaign-kpi-grid"
    >
      <div data-testid="campaign-kpi-audience">
        <StatCard
          title="Audience"
          value={summary.audienceCount.toLocaleString()}
          subtitle="Total targeted"
          icon={<Users className="text-violet-600 dark:text-violet-400" />}
        />
      </div>
      <StatCard
        title="Processed"
        value={summary.processedCount.toLocaleString()}
        subtitle="Outbound attempts"
        icon={<Clock className="text-slate-500" />}
      />
      <div data-testid="campaign-kpi-sent">
        <StatCard
          title="Sent"
          value={summary.sentCount.toLocaleString()}
          subtitle={deliveryRate}
          icon={<Send className="text-slate-600 dark:text-slate-300" />}
        />
      </div>
      <StatCard
        title="Delivered"
        value={summary.deliveredCount.toLocaleString()}
        subtitle={summary.sentCount > 0 ? 'Provider-confirmed' : '—'}
        icon={<CheckCircle2 className="text-emerald-600 dark:text-emerald-400" />}
      />
      <StatCard
        title="Failed"
        value={summary.failedCount.toLocaleString()}
        subtitle={summary.pendingCount > 0 ? `${summary.pendingCount} pending` : '—'}
        icon={<XCircle className="text-red-500 dark:text-red-400" />}
      />
      <StatCard
        title={summary.primaryMetricLabel}
        value={summary.primaryMetricValue.toLocaleString()}
        subtitle={summary.primaryMetricHint ?? campaign.type}
        icon={<BarChart3 className="text-violet-600 dark:text-violet-400" />}
      />
    </div>
  )
}
