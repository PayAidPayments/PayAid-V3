'use client'

import { ModuleTopBar } from './ModuleTopBar'

export function HRTopBar() {
  return (
    <ModuleTopBar
      moduleId="hr"
      moduleName="HR"
      items={[
        { name: 'Home', href: '/dashboard/hr', icon: '🏠' },
        { name: 'Employees', href: '/dashboard/hr/employees', icon: '👥' },
        { name: 'Payroll', href: '/dashboard/hr/payroll', icon: '💰' },
        { name: 'Attendance', href: '/dashboard/hr/attendance', icon: '📅' },
        { name: 'Leave', href: '/dashboard/hr/leave', icon: '🏖️' },
        { name: 'Reports', href: '/dashboard/hr/reports', icon: '📊' },
      ]}
    />
  )
}

