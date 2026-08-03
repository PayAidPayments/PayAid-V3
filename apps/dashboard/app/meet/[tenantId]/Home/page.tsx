'use client'

import { useParams } from 'next/navigation'
import { Video, Calendar } from 'lucide-react'
import { ProductivityToolHome } from '@/components/modules/dashboard/ProductivityToolHome'

export default function MeetDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''

  return (
    <ProductivityToolHome
      moduleId="meet"
      tenantId={tenantId}
      actions={[
        {
          label: 'Start meeting',
          href: `/meet/${tenantId}/Meetings`,
          icon: <Video className="w-4 h-4" />,
        },
        {
          label: 'Schedule',
          href: `/meet/${tenantId}/Meetings`,
          icon: <Calendar className="w-4 h-4" />,
          variant: 'secondary',
        },
        {
          label: 'Recordings',
          href: `/meet/${tenantId}/Recordings`,
          variant: 'secondary',
        },
        {
          label: 'Productivity hub',
          href: `/productivity/${tenantId}/Home`,
          variant: 'secondary',
        },
      ]}
      emptyIcon={<Video />}
      emptyTitle="No meetings scheduled"
      emptyDescription="Start or schedule a meeting. HD conferencing features continue to mature."
      emptyActionLabel="Start meeting"
      emptyActionHref={`/meet/${tenantId}/Meetings`}
    />
  )
}
