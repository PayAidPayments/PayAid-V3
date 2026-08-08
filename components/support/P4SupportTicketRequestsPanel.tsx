'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAuthHeaders } from '@/lib/api/client'

type ProductStatus = 'new' | 'open' | 'resolved' | 'closed'

type SliceTicket = {
  id: string
  ticketNumber?: string
  subject: string
  status: ProductStatus
  dbStatus?: string
  contactId?: string | null
  priority?: string
  createdAt?: string
}

const NEXT: Record<ProductStatus, ProductStatus[]> = {
  new: ['open', 'closed'],
  open: ['resolved', 'closed'],
  resolved: ['closed'],
  closed: [],
}

/**
 * Thin Support tickets operator panel — uses proven `/api/support/tickets/slice` only.
 * Authorized after hub probe found `/api/support/tickets` still returning demo rows on Ready.
 */
export function P4SupportTicketRequestsPanel() {
  const [tickets, setTickets] = useState<SliceTicket[]>([])
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/support/tickets/slice?limit=50', { headers: getAuthHeaders() })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(json?.error || `List failed (${res.status})`)
      return
    }
    setTickets(Array.isArray(json.tickets) ? json.tickets : [])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function createTicket() {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const res = await fetch('/api/support/tickets/slice', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim() || undefined,
          description: description.trim() || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `Create failed (${res.status})`)
        return
      }
      setSubject('')
      setDescription('')
      setInfo(`Created ${json.ticket?.subject || 'ticket'} (${json.ticket?.status})`)
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function setStatus(ticketId: string, status: ProductStatus) {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const res = await fetch('/api/support/tickets/slice', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', ticketId, status }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `Status failed (${res.status})`)
        return
      }
      setInfo(`Updated to ${json.ticket?.status}`)
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6" data-testid="p4-support-tickets-requests-panel">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Support ticket requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thin operator loop on <code>/api/support/tickets/slice</code> — new → open → resolved|closed.
          No live send / SLA / Unibox rebuild.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-medium">Create new ticket</h2>
        <Input
          placeholder="Subject (optional)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={busy}
        />
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
        />
        <Button onClick={() => void createTicket()} disabled={busy}>
          {busy ? 'Please wait…' : 'Create ticket'}
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}
      {info ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {info}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Tickets ({tickets.length})</h2>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={busy}>
            Refresh
          </Button>
        </div>
        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No slice tickets yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {tickets.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium">
                    {t.subject}{' '}
                    {t.ticketNumber ? (
                      <span className="text-xs text-muted-foreground">({t.ticketNumber})</span>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    status: {t.status}
                    {t.dbStatus ? ` · db: ${t.dbStatus}` : ''}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {NEXT[t.status].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void setStatus(t.id, s)}
                    >
                      → {s}
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

export default P4SupportTicketRequestsPanel
