'use client'

import { useParams } from 'next/navigation'
import { Truck } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'

export default function InventorySuppliersPage() {
  const params = useParams()
  const tenantId = params.tenantId as string

  return (
    <div className="space-y-6">
      <UniversalModuleHero
        moduleName="Suppliers"
        moduleIcon={<Truck className="h-8 w-8" />}
        gradientFrom="from-emerald-600"
        gradientTo="to-teal-900"
        subtitle="Manage suppliers and purchase requests. Link to Purchase Orders in Finance."
      />
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          Supplier management and purchase requests will be available here.
        </p>
      </div>
    </div>
  )
}
