'use client'

/**
 * P2 Appointments thin operator surface.
 * Uses /api/appointments/slice only — no calendar UI, no live reminder send.
 */
import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { Clock, Plus, RefreshCw } from 'lucide-react'

type ProductStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

interface SliceAppointment {
  id: string
  contactId?: string | null
  contactName: string
  contactEmail?: string | null
  appointmentDate: string
  startTime: string
  endTime?: string | null
  status: ProductStatus
  reminder?: { status?: string; sent?: boolean } | null
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return map[status] || map.pending
}

function nextActions(status: ProductStatus): ProductStatus[] {
  if (status === 'pending') return ['confirmed', 'cancelled']
  if (status === 'confirmed') return ['completed', 'cancelled']
  return []
}

export function P2AppointmentRequestsPanel({ contactId }: { contactId?: string }) {
  const { token } = useAuthStore()
  const [items, setItems] = useState<SliceAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  })
  const [startTime, setStartTime] = useState('10:00')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const q = new URLSearchParams({ limit: '50' })
      if (contactId) q.set('contactId', contactId)
      const res = await fetch(`/api/appointments/slice?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Load failed (${res.status})`)
      setItems(Array.isArray(data.appointments) ? data.appointments : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [token, contactId])

  useEffect(() => {
    void load()
  }, [load])

  const createRequest = async () => {
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      const appointmentDate = new Date(`${date}T00:00:00.000Z`).toISOString()
      const body: Record<string, unknown> = {
        appointmentDate,
        startTime,
        duration: 30,
        notes: 'P2 thin UI request',
      }
      if (contactId) body.contactId = contactId
      else {
        if (!name.trim()) throw new Error('Contact name is required')
        body.contactName = name.trim()
        if (email.trim()) body.contactEmail = email.trim()
      }
      const res = await fetch('/api/appointments/slice', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Create failed (${res.status})`)
      setName('')
      setEmail('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const setStatus = async (appointmentId: string, status: ProductStatus) => {
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/appointments/slice', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'status', appointmentId, status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Status update failed (${res.status})`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">
              New appointment request
            </h2>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              Saves to CRM with a draft-first reminder (PENDING, not sent).
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading || saving}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!contactId && (
            <>
              <label className="text-xs text-slate-600 dark:text-gray-300 space-y-1">
                <span>Contact name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                  placeholder="Jane Doe"
                />
              </label>
              <label className="text-xs text-slate-600 dark:text-gray-300 space-y-1">
                <span>Email (optional)</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                  placeholder="jane@example.com"
                />
              </label>
            </>
          )}
          <label className="text-xs text-slate-600 dark:text-gray-300 space-y-1">
            <span>Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
            />
          </label>
          <label className="text-xs text-slate-600 dark:text-gray-300 space-y-1">
            <span>Start time</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
            />
          </label>
        </div>

        <Button onClick={() => void createRequest()} disabled={saving || loading}>
          <Plus className="w-4 h-4 mr-1" />
          Create request
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-4">Upcoming</h2>
        {loading ? (
          <PageLoading message="Loading requests..." fullScreen={false} />
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-gray-400">No upcoming appointment requests.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 dark:border-gray-700 px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 dark:text-gray-100">{item.contactName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {String(item.appointmentDate).slice(0, 10)} · {item.startTime}
                    </span>
                    <span>
                      Reminder: {item.reminder?.status || 'n/a'}
                      {item.reminder?.sent === false ? ' · not sent' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {nextActions(item.status).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() => void setStatus(item.id, s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
