'use client'

import { useParams } from 'next/navigation'
import { ComingSoonModuleHome } from '@/components/modules/dashboard/ComingSoonModuleHome'

export default function LegalDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''

  return (
    <ComingSoonModuleHome
      moduleId="legal"
      title="Legal"
      tenantId={tenantId}
    />
  )
}
