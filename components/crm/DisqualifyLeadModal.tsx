'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { getAuthHeaders } from '@/lib/hooks/use-api'

const FALLBACK_REASONS = ['Not qualified', 'Wrong contact', 'Budget', 'Timing', 'No response', 'Duplicate', 'Not interested', 'Other']

interface DisqualifyLeadModalProps {
  leadId: string
  leadName: string
  tenantId: string
  onClose: () => void
  onSuccess: () => void
}

export function DisqualifyLeadModal({ leadId, leadName, tenantId, onClose, onSuccess }: DisqualifyLeadModalProps) {
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: reasonsData } = useQuery({
    queryKey: ['crm', 'disqualify-reasons', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/crm/settings/disqualify-reasons', { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      return data.reasons as string[]
    },
    enabled: !!tenantId,
  })
  const reasons = reasonsData && reasonsData.length > 0 ? reasonsData : FALLBACK_REASONS

  const displayReason = reason === 'Other' ? customReason : reason

  const handleSubmit = async () => {
    const finalReason = displayReason.trim() || 'Not specified'
    setSubmitting(true)
    try {
      const existingRes = await fetch(`/api/contacts/${leadId}?tenantId=${encodeURIComponent(tenantId)}`, {
        headers: getAuthHeaders(),
      })
      let existingNotes = ''
      if (existingRes.ok) {
        const existing = await existingRes.json()
        if (existing?.notes) existingNotes = String(existing.notes).trim()
      }
      const disqualifyLine = 'Disqualified on ' + new Date().toLocaleDateString() + ': ' + finalReason + (notes.trim() ? '\n' + notes.trim() : '')
      const newNotes = existingNotes ? existingNotes + '\n\n' + disqualifyLine : disqualifyLine

      const res = await fetch(`/api/contacts/${leadId}?tenantId=${encodeURIComponent(tenantId)}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'inactive',
          notes: newNotes,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || err.message || 'Failed to disqualify')
      }
      onSuccess()
      onClose()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to disqualify lead')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} aria-hidden />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Disqualify lead</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">{leadName}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Reason</label>
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
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Notes (optional)</label>
            <textarea
              placeholder="Additional context"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm px-3 py-2"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-300">Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
            {submitting ? 'Saving...' : 'Disqualify lead'}
          </Button>
        </div>
      </div>
    </>
  )
}
