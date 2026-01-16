'use client'

import { ModuleTopBar } from './ModuleTopBar'

export function CRMTopBar() {
  return (
    <ModuleTopBar
      moduleId="crm"
      moduleName="CRM"
      items={[
        { name: 'Home', href: '/dashboard/crm', icon: '🏠' },
        { name: 'Leads', href: '/dashboard/crm/leads', icon: '🎯' },
        { name: 'Contacts', href: '/dashboard/contacts', icon: '👥' },
        { name: 'Accounts', href: '/dashboard/crm/accounts', icon: '🏢' },
        { name: 'Deals', href: '/dashboard/deals', icon: '💼' },
        { name: 'Tasks', href: '/dashboard/tasks', icon: '✅' },
        { name: 'Reports', href: '/dashboard/crm/reports', icon: '📊' },
      ]}
    />
  )
}

