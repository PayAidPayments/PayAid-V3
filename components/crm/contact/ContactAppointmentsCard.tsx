'use client'

/**
 * CRM contact appointments panel for P2 slice.
 * GET /api/crm/contacts/[id]/appointments + status via /api/appointments/slice.
 * No calendar UI, no live reminder send.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Calendar, Clock } from 'lucide-react'

type ProductStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

interface ContactAppointment {
  id: string
  contactName?: string
  appointmentDate: string
  startTime: string
  status: ProductStatus | string
}

function nextActions(status: string): ProductStatus[] {
  if (status === 'pending') return ['confirmed', 'cancelled']
  if (status === 'confirmed') return ['completed', 'cancelled']
  return []
}

export function ContactAppointmentsCard({
  contactId,
}: {
  tenantId?: string
  contactId: string
}) {
  const { token } = useAuthStore()
  const [upcoming, setUpcoming] = useState<ContactAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/crm/contacts/${contactId}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Load failed (${res.status})`)
      setUpcoming(Array.isArray(data.upcoming) ? data.upcoming : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [token, contactId])

  useEffect(() => {
    void load()
  }, [load])

  const setStatus = async (appointmentId: string, status: ProductStatus) => {
    if (!token) return
    setBusy(true)
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
      if (!res.ok) throw new Error(data.error || `Update failed (${res.status})`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Appointments
        </h2>
        <Link
          href={`/dashboard/appointments/requests?contactId=${encodeURIComponent(contactId)}`}
          className="text-xs text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Request
        </Link>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 dark:text-gray-400">Loading…</p>
      ) : upcoming.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-gray-400">No upcoming appointments.</p>
      ) : (
        <ul className="space-y-2">
          {upcoming.slice(0, 5).map((row) => (
            <li key={row.id} className="rounded-lg border border-slate-200 dark:border-gray-700 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-800 dark:text-gray-100 capitalize">
                  {row.status}
                </span>
                <span className="text-xs text-slate-500 dark:text-gray-400 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {String(row.appointmentDate).slice(0, 10)} · {row.startTime}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {nextActions(String(row.status)).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={busy}
                    onClick={() => void setStatus(row.id, s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
