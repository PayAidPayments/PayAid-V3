'use client'

/**
 * P3 Finance invoice thin operator surface (static — no Suspense/searchParams).
 * Uses /api/finance/invoices/slice only.
 */
import { P3InvoiceRequestsPanel } from '@/components/finance/P3InvoiceRequestsPanel'

export default function InvoiceRequestsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-gray-100">
            Invoice requests
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            P3 thin operator surface — draft → issued → paid|cancelled. No GST rebuild. No live send. No new gateway.
          </p>
        </header>
        <P3InvoiceRequestsPanel />
      </div>
    </div>
  )
}
