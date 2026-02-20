'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function HRHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Dashboard', href: `/hr/${tenantId}/Home` },
    { name: 'Employees', href: `/hr/${tenantId}/Employees` },
    { name: 'Contractors', href: `/hr/${tenantId}/Contractors` },
    { name: 'Recruitment', href: `/hr/${tenantId}/Recruitment` },
    { name: 'Onboarding', href: `/hr/${tenantId}/Onboarding` },
    { name: 'Offboarding', href: `/hr/${tenantId}/Offboarding` },
    { name: 'Payroll Runs', href: `/hr/${tenantId}/Payroll-Runs` },
    { name: 'Salary Structures', href: `/hr/${tenantId}/Salary-Structures` },
    { name: 'Attendance', href: `/hr/${tenantId}/Attendance` },
    { name: 'Leaves & Holidays', href: `/hr/${tenantId}/Leave` },
    { name: 'Performance', href: `/hr/${tenantId}/Performance` },
    { name: 'Payslips & Forms', href: `/hr/${tenantId}/Payslips` },
    { name: 'Reimbursements', href: `/hr/${tenantId}/Reimbursements` },
    { name: 'Assets', href: `/hr/${tenantId}/Assets` },
    { name: 'Compliance', href: `/hr/${tenantId}/Statutory-Compliance` },
    { name: 'Documents', href: `/hr/${tenantId}/Documents` },
    { name: 'Insurance & Benefits', href: `/hr/${tenantId}/Insurance` },
    { name: 'Reports & Analytics', href: `/hr/${tenantId}/Reports` },
    { name: 'Settings', href: `/hr/${tenantId}/Settings` },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="hr"
          moduleName="HR"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
