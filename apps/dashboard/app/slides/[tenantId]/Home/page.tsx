'use client'

import { useParams } from 'next/navigation'
import { Presentation, Plus } from 'lucide-react'
import { ProductivityToolHome } from '@/components/modules/dashboard/ProductivityToolHome'

export default function SlidesDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''

  return (
    <ProductivityToolHome
      moduleId="slides"
      tenantId={tenantId}
      actions={[
        {
          label: 'New presentation',
          href: `/slides/${tenantId}/Presentations`,
          icon: <Plus className="w-4 h-4" />,
        },
        {
          label: 'Templates',
          href: `/slides/${tenantId}/Templates`,
          variant: 'secondary',
        },
        {
          label: 'Productivity hub',
          href: `/productivity/${tenantId}/Home`,
          variant: 'secondary',
        },
      ]}
      emptyIcon={<Presentation />}
      emptyTitle="No presentations yet"
      emptyDescription="Create a deck to get started. Themes and present mode are expanding over time."
      emptyActionLabel="New presentation"
      emptyActionHref={`/slides/${tenantId}/Presentations`}
    />
  )
}
