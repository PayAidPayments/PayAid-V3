'use client'

import { useParams } from 'next/navigation'
import { ComingSoonModuleHome } from '@/components/modules/dashboard/ComingSoonModuleHome'

export default function HospitalityDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''

  return (
    <ComingSoonModuleHome
      moduleId="hospitality"
      title="Hospitality"
      tenantId={tenantId}
    />
  )
}
