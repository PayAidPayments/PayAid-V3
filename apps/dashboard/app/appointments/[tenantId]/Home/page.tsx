'use client'

import { useParams } from 'next/navigation'
import { ComingSoonModuleHome } from '@/components/modules/dashboard/ComingSoonModuleHome'

export default function AppointmentsDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''

  return (
    <ComingSoonModuleHome
      moduleId="appointments"
      title="Appointments"
      tenantId={tenantId}
      emptyTitle="Appointments operator loop"
      emptyDescription="Use the thin operator requests UI for create/list. Full module KPIs stay reserved until scheduling depth ships."
      emptyActionLabel="Open CRM"
      emptyActionHref={`/crm/${tenantId}/Home`}
      actions={[
        {
          label: 'Back to CRM',
          href: `/crm/${tenantId}/Home`,
        },
      ]}
    />
  )
}
