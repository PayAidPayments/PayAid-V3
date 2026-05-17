'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function FinanceHomePage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Finance & Compliance</h1>
      <p className="text-slate-600 text-sm">
        Canonical finance app (Wave 1). GST, invoices, and accounting modules remain on dashboard until ported.
      </p>
      <ul className="space-y-2 text-sm">
        <li>
          <Link className="text-blue-600 underline" href={`/finance/${tenantId}/Billing`}>
            Billing & subscription invoices
          </Link>
        </li>
      </ul>
    </main>
  )
}
