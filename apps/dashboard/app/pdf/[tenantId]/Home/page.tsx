'use client'

import { useParams } from 'next/navigation'
import { FileType, Upload, Merge } from 'lucide-react'
import { ProductivityToolHome } from '@/components/modules/dashboard/ProductivityToolHome'

export default function PDFToolsDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''

  return (
    <ProductivityToolHome
      moduleId="pdf"
      tenantId={tenantId}
      actions={[
        {
          label: 'Open tools',
          href: `/pdf/${tenantId}/Tools`,
          icon: <Merge className="w-4 h-4" />,
        },
        {
          label: 'My PDFs',
          href: `/pdf/${tenantId}/MyPDFs`,
          icon: <Upload className="w-4 h-4" />,
          variant: 'secondary',
        },
        {
          label: 'Productivity hub',
          href: `/productivity/${tenantId}/Home`,
          variant: 'secondary',
        },
      ]}
      emptyIcon={<FileType />}
      emptyTitle="No PDF files yet"
      emptyDescription="Upload a PDF or open tools to merge, split, and compress. Full editor depth is still rolling out."
      emptyActionLabel="Open PDF tools"
      emptyActionHref={`/pdf/${tenantId}/Tools`}
    />
  )
}
