'use client'

import { useParams } from 'next/navigation'
import { ComingSoonModuleHome } from '@/components/modules/dashboard/ComingSoonModuleHome'

export default function FinancialServicesDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''

  return (
    <ComingSoonModuleHome
      moduleId="financial-services"
      title="Financial Services"
      tenantId={tenantId}
    />
  )
}
