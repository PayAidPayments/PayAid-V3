'use client'

/**
 * Phase A3: Deal timeline – key events: created, stage close (won/lost), quotes, proposals, contact interactions.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Calendar,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Trophy,
  XCircle,
  Briefcase,
  Send,
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { useTerms } from '@/lib/terminology/use-terms'

export type TimelineEventType =
  | 'deal_created'
  | 'deal_won'
  | 'deal_lost'
  | 'quote'
  | 'proposal'
  | 'email'
  | 'call'
  | 'meeting'
  | 'whatsapp'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  title: string
  description?: string
  createdAt: string
  metadata?: Record<string, unknown>
  href?: string
}

interface DealTimelineProps {
  dealId: string
  tenantId: string
  deal: {
    createdAt: string
    updatedAt: string
    stage: string
    actualCloseDate?: string | null
    wonReason?: string | null
    lostReason?: string | null
    contactId?: string | null
  }
}

export function DealTimeline({ dealId, tenantId, deal }: DealTimelineProps) {
  const { term } = useTerms()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { token } = useAuthStore()

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    const headers: HeadersInit = { Authorization: `Bearer ${token}` }

    async function load() {
      setIsLoading(true)
      try {
        const base: TimelineEvent[] = [
          {
            id: 'deal-created',
            type: 'deal_created',
            title: `${term('deal')} created`,
            createdAt: deal.createdAt,
            metadata: {},
          },
        ]

        if (deal.stage === 'won' && deal.actualCloseDate) {
          base.push({
            id: 'deal-won',
            type: 'deal_won',
            title: `${term('deal')} won`,
            description: deal.wonReason || undefined,
            createdAt: deal.actualCloseDate,
            metadata: {},
          })
        } else if (deal.stage === 'lost' && deal.actualCloseDate) {
          base.push({
            id: 'deal-lost',
            type: 'deal_lost',
            title: `${term('deal')} lost`,
            description: deal.lostReason || undefined,
            createdAt: deal.actualCloseDate,
            metadata: {},
          })
        }

        const promises: Promise<void>[] = []

        // Quotes for this deal
        promises.push(
          fetch(`/api/quotes?dealId=${dealId}`, { headers })
            .then(async (r) => {
              if (!r.ok) return
              const json = await r.json()
              const list = json?.data ?? []
              list.forEach((q: { id: string; createdAt: string; status?: string; quoteNumber?: string }) => {
                base.push({
                  id: `quote-${q.id}`,
                  type: 'quote',
                  title: `Quote ${q.quoteNumber || q.id.slice(0, 8)} created`,
                  description: q.status ? `Status: ${q.status}` : undefined,
                  createdAt: q.createdAt,
                  href: `/crm/${tenantId}/Quotes/${q.id}`,
                  metadata: q,
                })
              })
            })
            .catch(() => {})
        )

        // Proposals for this deal
        promises.push(
          fetch(`/api/proposals?dealId=${dealId}`, { headers })
            .then(async (r) => {
              if (!r.ok) return
              const json = await r.json()
              const list = json?.data ?? []
              list.forEach((p: { id: string; createdAt: string; sentAt?: string | null; title?: string; status?: string }) => {
                const date = p.sentAt || p.createdAt
                base.push({
                  id: `proposal-${p.id}`,
                  type: 'proposal',
                  title: p.title ? `Proposal: ${p.title}` : 'Proposal sent',
                  description: p.status ? `Status: ${p.status}` : undefined,
                  createdAt: date,
                  metadata: p,
                })
              })
            })
            .catch(() => {})
        )

        // Contact interactions (when deal has a contact)
        if (deal.contactId) {
          promises.push(
            fetch(
              `/api/interactions?contactId=${encodeURIComponent(deal.contactId)}&limit=30&tenantId=${encodeURIComponent(tenantId)}`,
              { headers }
            )
              .then(async (r) => {
                if (!r.ok) return
                const json = await r.json()
                const list = json?.interactions ?? []
                list.forEach((i: { id: string; type: string; subject?: string; notes?: string; createdAt: string }) => {
                  const type = (i.type === 'email' ? 'email' : i.type === 'whatsapp' ? 'whatsapp' : i.type === 'meeting' ? 'meeting' : 'call') as TimelineEventType
                  let title = i.subject || `${i.type}`
                  if (type === 'call') title = 'Call logged'
                  else if (type === 'meeting') title = 'Meeting' + (i.subject ? `: ${i.subject}` : '')
                  base.push({
                    id: `int-${i.id}`,
                    type,
                    title,
                    description: i.notes || undefined,
                    createdAt: i.createdAt,
                    metadata: i,
                  })
                })
              })
              .catch(() => {})
          )
        }

        await Promise.all(promises)

        base.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setEvents(base)
      } catch (err) {
        console.error('DealTimeline load error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [dealId, tenantId, deal.createdAt, deal.updatedAt, deal.stage, deal.actualCloseDate, deal.wonReason, deal.lostReason, deal.contactId, token])

  function getIcon(type: TimelineEventType) {
    switch (type) {
      case 'deal_created':
        return <Briefcase className="w-4 h-4" />
      case 'deal_won':
        return <Trophy className="w-4 h-4" />
      case 'deal_lost':
        return <XCircle className="w-4 h-4" />
      case 'quote':
        return <FileText className="w-4 h-4" />
      case 'proposal':
        return <Send className="w-4 h-4" />
      case 'email':
        return <Mail className="w-4 h-4" />
      case 'call':
        return <Phone className="w-4 h-4" />
      case 'meeting':
        return <Calendar className="w-4 h-4" />
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  function getColor(type: TimelineEventType) {
    switch (type) {
      case 'deal_created':
        return 'bg-slate-500'
      case 'deal_won':
        return 'bg-green-500'
      case 'deal_lost':
        return 'bg-red-500'
      case 'quote':
      case 'proposal':
        return 'bg-blue-500'
      case 'email':
        return 'bg-indigo-500'
      case 'call':
        return 'bg-emerald-500'
      case 'meeting':
        return 'bg-purple-500'
      case 'whatsapp':
        return 'bg-green-600'
      default:
        return 'bg-gray-500'
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-4">{`${term('deal')} timeline`}</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-slate-100 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-4">{`${term('deal')} timeline`}</h2>
        <p className="text-sm text-slate-500 dark:text-gray-400">No events yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-4">{`${term('deal')} timeline`}</h2>
      <ul className="space-y-0">
        {events.map((evt, idx) => (
          <li key={evt.id} className="relative flex gap-3 pb-4 last:pb-0">
            {idx < events.length - 1 && (
              <span
                className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-200 dark:bg-gray-600"
                aria-hidden
              />
            )}
            <span
              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white ${getColor(evt.type)}`}
            >
              {getIcon(evt.type)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                {evt.href ? (
                  <Link
                    href={evt.href}
                    className="text-sm font-medium text-slate-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate"
                  >
                    {evt.title}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-slate-900 dark:text-gray-100">{evt.title}</span>
                )}
                <span className="text-xs text-slate-500 dark:text-gray-400 shrink-0">
                  {formatDistanceToNow(new Date(evt.createdAt), { addSuffix: true })}
                </span>
              </div>
              {evt.description && (
                <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5 line-clamp-2">{evt.description}</p>
              )}
              <time className="text-xs text-slate-400 dark:text-gray-500 mt-0.5" dateTime={evt.createdAt}>
                {format(new Date(evt.createdAt), 'MMM d, yyyy · HH:mm')}
              </time>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
