'use client'

import Link from 'next/link'
import { SuperAdminNavigation } from './SuperAdminNavigation'
import { AdminHeader } from './AdminHeader'
import { GlobalSearch } from './GlobalSearch'

// Re-export for convenience
export { GlobalSearch } from './GlobalSearch'
export { TabbedPage } from './TabbedPage'

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <Link href="/super-admin" className="font-semibold text-lg">
            PayAid Super Admin
          </Link>
        </div>
        <SuperAdminNavigation />
      </aside>
      <div className="flex-1 flex flex-col">
        <div className="border-b bg-white">
          <div className="h-16 flex items-center px-6 gap-4">
            <div className="flex-1">
              <GlobalSearch />
            </div>
          </div>
        </div>
        <AdminHeader title="PayAid Super Admin" subtitle="Platform administration" />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
