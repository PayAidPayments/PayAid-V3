'use client'

/**
 * Phase A1: Next-best-action card – one clear suggested action with one-click CTAs.
 * Uses nurture_action from lead score and lastContactedAt for "No touch in X days".
 */

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Target, CheckCircle, Mail, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface NurtureData {
  nurture_action?: string
  stage?: string
  components?: { nurture_action?: string }
}

interface NextBestActionCardProps {
  contactId: string
  tenantId: string
  onOpenMoreActions?: () => void
  contact: {
    name?: string
    email?: string | null
    phone?: string | null
    lastContactedAt?: string | null
    type?: string
  }
}

function formatWhatsAppPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('91') ? digits : '91' + digits
}

export function NextBestActionCard({ contactId, tenantId, contact, onOpenMoreActions }: NextBestActionCardProps) {
  const isProspect = contact?.type === 'lead'
  const lastContacted = contact?.lastContactedAt ? new Date(contact.lastContactedAt) : null
  const now = new Date()
  const daysSinceTouch = lastContacted
    ? Math.floor((now.getTime() - lastContacted.getTime()) / (24 * 60 * 60 * 1000))
    : null
  const noTouchTooLong = daysSinceTouch !== null && daysSinceTouch >= 7
  const hasEmail = !!contact?.email?.trim()
  const hasPhone = !!contact?.phone?.trim()
  const waUrl = hasPhone
    ? `https://wa.me/${formatWhatsAppPhone(contact.phone)}`
    : null

  const { data: nurtureData } = useQuery<NurtureData>({
    queryKey: ['lead-nurture', contactId],
    queryFn: async () => {
      const res = await apiRequest(`/api/leads/score?contactId=${contactId}&useGroq=true`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: !!contactId && isProspect,
  })

  const nurtureAction =
    nurtureData?.nurture_action ?? (nurtureData?.components as { nurture_action?: string } | undefined)?.nurture_action
  const suggestion =
    noTouchTooLong && daysSinceTouch !== null
      ? `No touch in ${daysSinceTouch} days – send a follow-up`
      : nurtureAction || (isProspect ? 'Reach out to move this lead forward' : 'Schedule a check-in with this contact')

  return (
    <Card data-testid="next-best-action-card" className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-500" />
          Suggested next step
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-gray-300">{suggestion}</p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/crm/${tenantId}/Tasks/new?contactId=${contactId}`}>
            <Button size="sm" variant="outline" className="gap-1.5 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              <CheckCircle className="w-3.5 h-3.5" />
              Create task
            </Button>
          </Link>
          {hasEmail && (
            <a href={`mailto:${contact.email}`}>
              <Button size="sm" variant="outline" className="gap-1.5 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <Mail className="w-3.5 h-3.5" />
                Email
              </Button>
            </a>
          )}
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </Button>
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenMoreActions}
          className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          More actions
        </button>
        {lastContacted && (
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Last contact: {formatDistanceToNow(lastContacted, { addSuffix: true })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
