'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function PDFTenantLayout({ children }: { children: React.ReactNode }) {
  const tenantId = useParams().tenantId as string
  const items = [
    { name: 'Home', href: `/pdf/${tenantId}/Home` },
    { name: 'PDF Tools', href: `/pdf/${tenantId}/Tools` },
    { name: 'My PDFs', href: `/pdf/${tenantId}/MyPDFs` },
  ]
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar moduleId="pdf" moduleName="PDF Tools" items={items} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
