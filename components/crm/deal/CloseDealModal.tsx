'use client'

/**
 * Phase A2: Win/loss + reason and competitor when closing a deal.
 * Uses configurable reasons from /api/crm/settings/lost-reasons and won-reasons when tenantId is provided.
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { getAuthHeaders } from '@/lib/hooks/use-api'

const FALLBACK_LOST = ['Budget constraints', 'Chose competitor', 'Timeline mismatch', 'No longer needed', 'Pricing', 'Feature gap', 'Other']
const FALLBACK_WON = ['Price / value', 'Relationship', 'Product fit', 'Timing', 'Other']

interface CloseDealModalProps {
  outcome: 'won' | 'lost'
  dealName: string
  onClose: () => void
  onConfirm: (payload: { reason: string; competitor?: string }) => Promise<void>
  /** When provided, reasons are fetched from CRM settings API */
  tenantId?: string
}

export function CloseDealModal({ outcome, dealName, onClose, onConfirm, tenantId }: CloseDealModalProps) {
  const [reason, setReason] = useState('')
  const [competitor, setCompetitor] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const lostQuery = useQuery({
    queryKey: ['crm', 'lost-reasons', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/crm/settings/lost-reasons', { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      return data.reasons as string[]
    },
    enabled: !!tenantId && outcome === 'lost',
  })
  const wonQuery = useQuery({
    queryKey: ['crm', 'won-reasons', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/crm/settings/won-reasons', { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      return data.reasons as string[]
    },
    enabled: !!tenantId && outcome === 'won',
  })

  const lostReasons = (tenantId && lostQuery.data) ? lostQuery.data : FALLBACK_LOST
  const wonReasons = (tenantId && wonQuery.data) ? wonQuery.data : FALLBACK_WON
  const reasons = outcome === 'lost' ? lostReasons : wonReasons
  const displayReason = reason === 'Other' ? customReason : reason

  const handleSubmit = async () => {
    const finalReason = displayReason.trim() || (outcome === 'lost' ? 'Not specified' : 'Won')
    setSubmitting(true)
    try {
      await onConfirm({
        reason: finalReason,
        competitor: competitor.trim() || undefined,
      })
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} aria-hidden />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
            Mark as {outcome === 'won' ? 'Won' : 'Lost'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
          {dealName}
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
              {outcome === 'lost' ? 'Why did we lose?' : 'Why did we win?'}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm px-3 py-2"
            >
              <option value="">Select...</option>
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {reason === 'Other' && (
              <input
                type="text"
                placeholder="Specify reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm px-3 py-2"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
              Competitor (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Competitor name"
              value={competitor}
              onChange={(e) => setCompetitor(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm px-3 py-2"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-300">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className={outcome === 'won' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {submitting ? 'Saving...' : `Mark as ${outcome === 'won' ? 'Won' : 'Lost'}`}
          </Button>
        </div>
      </div>
    </>
  )
}
