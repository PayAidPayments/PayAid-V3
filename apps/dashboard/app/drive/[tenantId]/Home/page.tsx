'use client'

import { useParams } from 'next/navigation'
import { Folder, Upload, FolderPlus } from 'lucide-react'
import { ProductivityToolHome } from '@/components/modules/dashboard/ProductivityToolHome'

export default function DriveDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''

  return (
    <ProductivityToolHome
      moduleId="drive"
      tenantId={tenantId}
      actions={[
        {
          label: 'My Drive',
          href: `/drive/${tenantId}/MyDrive`,
          icon: <Upload className="w-4 h-4" />,
        },
        {
          label: 'Shared',
          href: `/drive/${tenantId}/Shared`,
          icon: <FolderPlus className="w-4 h-4" />,
          variant: 'secondary',
        },
        {
          label: 'Productivity hub',
          href: `/productivity/${tenantId}/Home`,
          variant: 'secondary',
        },
      ]}
      emptyIcon={<Folder />}
      emptyTitle="No files yet"
      emptyDescription="Upload files to Drive to organize and share. Storage analytics will appear here when available."
      emptyActionLabel="Open My Drive"
      emptyActionHref={`/drive/${tenantId}/MyDrive`}
    />
  )
}
