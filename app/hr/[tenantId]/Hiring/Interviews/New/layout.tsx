'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function HRHiringInterviewsNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/hr/${tenantId}/Home` },
    { name: 'Employees', href: `/hr/${tenantId}/Employees` },
    { name: 'Payroll', href: `/hr/${tenantId}/Payroll` },
    { name: 'Leave', href: `/hr/${tenantId}/Leave` },
    { name: 'Attendance', href: `/hr/${tenantId}/Attendance` },
    { name: 'Hiring', href: `/hr/${tenantId}/Hiring` },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="hr"
          moduleName="HR"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
