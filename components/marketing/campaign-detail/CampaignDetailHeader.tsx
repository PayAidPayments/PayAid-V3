'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Copy,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Send,
} from 'lucide-react'
import type { CampaignDetailPayload } from '@/lib/marketing/campaign-detail-payload'
import { CampaignStatusHealthBanner } from './CampaignStatusHealthBanner'
import { cn } from '@/lib/utils/cn'

function channelLabel(type: string) {
  const t = type.toLowerCase()
  if (t === 'email') return 'Email'
  if (t === 'whatsapp') return 'WhatsApp'
  if (t === 'sms') return 'SMS'
  if (t === 'ads') return 'Ads'
  if (t === 'social') return 'Social'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase()
  if (s === 'sent' || s === 'completed') return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
  if (s === 'scheduled') return 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200'
  if (s === 'draft') return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  if (s === 'failed' || s === 'cancelled') return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200'
  return 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200'
}

export function CampaignDetailHeader({
  tenantId,
  payload,
  sendPending,
  onSend,
  onRetry,
}: {
  tenantId: string
  payload: CampaignDetailPayload
  sendPending: boolean
  onSend: () => void
  onRetry: () => void
}) {
  const { campaign, audience, warnings } = payload
  const created = campaign.createdAt ? format(new Date(campaign.createdAt), 'MMM d, yyyy HH:mm') : '—'

  return (
    <div className="space-y-4" data-testid="campaign-header">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 truncate">
            {campaign.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary" className="font-medium uppercase text-[11px] tracking-wide">
              {channelLabel(campaign.type)}
            </Badge>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                statusBadgeClass(campaign.status)
              )}
            >
              {campaign.status}
            </span>
            <Badge variant="outline" className="text-xs font-normal text-slate-600 dark:text-slate-400">
              {audience.sourceType === 'segment' ? 'Segment' : audience.sourceType === 'list' ? 'List' : 'Audience'}
            </Badge>
            <span className="text-slate-500 dark:text-slate-400">Created {created}</span>
          </div>
          {warnings.length > 0 && <CampaignStatusHealthBanner warnings={warnings} />}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link href={`/marketing/${tenantId}/Campaigns`}>
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <Button type="button" variant="outline" size="sm" disabled title="Editor coming soon">
            <Pencil className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
          <Link href={`/marketing/${tenantId}/Campaigns/New`} scroll={false}>
            <Button type="button" variant="outline" size="sm" title="Start from this campaign in the composer">
              <Copy className="h-4 w-4 mr-1.5" />
              Duplicate
            </Button>
          </Link>
          {campaign.status.toLowerCase() === 'draft' && (
            <Button
              type="button"
              size="sm"
              className="gap-1.5 bg-violet-600 hover:bg-violet-700"
              disabled={sendPending}
              title={sendPending ? 'Sending…' : 'Send now'}
              onClick={onSend}
            >
              <Send className="h-4 w-4" />
              {sendPending ? 'Sending…' : 'Send'}
            </Button>
          )}
          {(campaign.status.toLowerCase() === 'failed' ||
            (campaign.status.toLowerCase() === 'completed' && payload.summary.sentCount === 0)) && (
            <Button type="button" variant="secondary" size="sm" className="gap-1.5" disabled={sendPending} onClick={onRetry}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled title="More actions coming soon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
