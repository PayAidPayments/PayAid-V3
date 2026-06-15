'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

const NAV = [
  { label: 'Home', segment: 'Home' },
  { label: 'Billing', segment: 'Billing' },
]

export default function FinanceTenantLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white px-4 py-3 flex items-center gap-4">
        <span className="font-semibold text-slate-900">PayAid Finance</span>
        <nav className="flex gap-3 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.segment}
              href={`/finance/${tenantId}/${item.segment}`}
              className="text-slate-600 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  )
}
