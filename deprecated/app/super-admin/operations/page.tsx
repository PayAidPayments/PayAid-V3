'use client'

import { TabbedPage } from '@/components/super-admin/layout/TabbedPage'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Import existing page components
import SuperAdminTasksPage from './tasks/page'
import SuperAdminSystemPage from '../system/page'
import SuperAdminDatabasePage from '../database/page'
import SuperAdminAIPage from '../ai/page'
import SuperAdminCommunicationPage from '../communication/page'

const tabs = [
  { id: 'tasks', label: 'Task Queue', href: '/super-admin/operations/tasks' },
  { id: 'system', label: 'System Health', href: '/super-admin/operations/system' },
  { id: 'database', label: 'Database & Backups', href: '/super-admin/operations/database' },
  { id: 'ai', label: 'AI & Automations', href: '/super-admin/operations/ai' },
  { id: 'communication', label: 'Communication', href: '/super-admin/operations/communication' },
]

export default function OperationsPage() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname === '/super-admin/operations') {
      router.replace('/super-admin/operations/tasks')
    }
  }, [pathname, router])

  const activeTab = tabs.find((tab) => pathname === tab.href || pathname.startsWith(tab.href + '/')) || tabs[0]

  return (
    <TabbedPage
      title="Operations"
      description="Health, infrastructure, jobs, AI, communications"
      tabs={tabs}
    >
      {activeTab.id === 'tasks' && <SuperAdminTasksPage />}
      {activeTab.id === 'system' && <SuperAdminSystemPage />}
      {activeTab.id === 'database' && <SuperAdminDatabasePage />}
      {activeTab.id === 'ai' && <SuperAdminAIPage />}
      {activeTab.id === 'communication' && <SuperAdminCommunicationPage />}
    </TabbedPage>
  )
}
