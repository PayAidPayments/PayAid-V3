'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { P2AppointmentRequestsPanel } from '@/components/appointments/P2AppointmentRequestsPanel'
import { PageLoading } from '@/components/ui/loading'

function RequestsInner() {
  const params = useSearchParams()
  const contactId = params.get('contactId') || undefined
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-gray-100">
            Appointment requests
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            P2 thin operator surface — create, list upcoming, update status. No calendar. No live reminder send.
          </p>
        </header>
        <P2AppointmentRequestsPanel contactId={contactId} />
      </div>
    </div>
  )
}

export default function AppointmentRequestsPage() {
  return (
    <Suspense fallback={<PageLoading message="Loading…" fullScreen={false} />}>
      <RequestsInner />
    </Suspense>
  )
}
