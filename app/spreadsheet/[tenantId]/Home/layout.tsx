'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function SpreadsheetHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/spreadsheet/${tenantId}/Home` },
    { name: 'Spreadsheets', href: `/spreadsheet/${tenantId}/Spreadsheets` },
    { name: 'Templates', href: `/spreadsheet/${tenantId}/Templates` },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="spreadsheet"
          moduleName="Spreadsheet"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
