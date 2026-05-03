'use client'

import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/modules/AppShell'
import { getSettingsNavItems } from '@/lib/settings/settings-nav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const tenantId = params.tenantId as string
  const navItems = getSettingsNavItems(tenantId)
  const topBarItems = [{ name: 'Settings', href: `/settings/${tenantId}` }]
  const sidebar = (
    <nav className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-2 space-y-0.5">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== `/settings/${tenantId}` && pathname?.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
  return (
    <AppShell moduleId="settings" moduleName="Settings" topBarItems={topBarItems} sidebar={sidebar}>
      {children}
    </AppShell>
  )
}
