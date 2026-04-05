'use client'

import { useParams } from 'next/navigation'
import { Wallet } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'

export default function FinancePaymentsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string

  return (
    <div className="space-y-6">
      <UniversalModuleHero
        moduleName="Payments"
        moduleIcon={<Wallet className="h-8 w-8" />}
        gradientFrom="from-violet-600"
        gradientTo="to-indigo-900"
        subtitle="PayAid Payments Gateway — payment links, UPI QR, settlements, and transaction history."
      />
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          Payments dashboard will be available here. Integrate PayAid Payments for payment links, QR codes, and settlements.
        </p>
      </div>
    </div>
  )
}
