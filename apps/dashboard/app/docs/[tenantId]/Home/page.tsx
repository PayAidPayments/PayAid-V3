'use client'

import { useParams } from 'next/navigation'
import { FileEdit, Plus, Folder } from 'lucide-react'
import { ProductivityToolHome } from '@/components/modules/dashboard/ProductivityToolHome'

export default function DocsDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''

  return (
    <ProductivityToolHome
      moduleId="docs"
      tenantId={tenantId}
      actions={[
        {
          label: 'New document',
          href: `/docs/${tenantId}/Documents`,
          icon: <Plus className="w-4 h-4" />,
        },
        {
          label: 'Folders',
          href: `/docs/${tenantId}/Folders`,
          icon: <Folder className="w-4 h-4" />,
          variant: 'secondary',
        },
        {
          label: 'Productivity hub',
          href: `/productivity/${tenantId}/Home`,
          variant: 'secondary',
        },
      ]}
      emptyIcon={<FileEdit />}
      emptyTitle="No documents yet"
      emptyDescription="Create your first document to start collaborating. Rich editing depth continues to roll out."
      emptyActionLabel="Create document"
      emptyActionHref={`/docs/${tenantId}/Documents`}
    />
  )
}
