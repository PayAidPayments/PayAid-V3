'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ListOrdered } from 'lucide-react'

/**
 * CRM-scoped entry to sales sequences (audit: data-sequence).
 * Marketing module may own persistence; this page exposes the route expected by E2E.
 */
export default function CRMSequencesPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Sales sequences</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Multi-step outreach tracks for prospects (CRM shell).
        </p>
      </div>

      <div
        data-sequence="default"
        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex items-start gap-3"
      >
        <ListOrdered className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Sequences</p>
          <p className="text-xs text-slate-500 mt-1">
            Create and manage multi-channel sequences in Marketing, or enroll from a lead&apos;s contact
            record.
          </p>
          <Link
            href={`/marketing/${tenantId}/Sequences`}
            className="inline-flex mt-3 text-xs font-medium text-indigo-600 hover:underline"
          >
            Open Marketing sequences
          </Link>
        </div>
      </div>
    </div>
  )
}
