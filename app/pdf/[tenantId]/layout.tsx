'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function PDFTenantLayout({ children }: { children: React.ReactNode }) {
  const tenantId = useParams().tenantId as string
  const topBarItems = [
    { name: 'Home', href: `/pdf/${tenantId}/Home` },
    { name: 'PDF Tools', href: `/pdf/${tenantId}/Tools` },
    { name: 'My PDFs', href: `/pdf/${tenantId}/MyPDFs` },
  ]
  return (
    <AppShell moduleId="pdf" moduleName="PDF Tools" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
