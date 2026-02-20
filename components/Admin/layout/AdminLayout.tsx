'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { useAuthStore } from '@/lib/stores/auth'
import {
  LayoutDashboard,
  Users,
  Shield,
  Puzzle,
  CreditCard,
  Plug,
  FileText,
  ClipboardCheck,
  Settings,
} from 'lucide-react'
import { BillingIcon } from '@/components/shared/BillingIcon'
import { AdminHeader } from '../../super-admin/layout/AdminHeader'

const nav: Array<{
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  useCurrencyIcon?: boolean
}> = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/onboarding', label: 'Onboarding', icon: ClipboardCheck },
  { href: '/admin/users', label: 'Users & invites', icon: Users },
  { href: '/admin/roles', label: 'Roles & permissions', icon: Shield },
  { href: '/admin/modules', label: 'Modules', icon: Puzzle },
  { href: '/admin/billing', label: 'Billing', icon: CreditCard, useCurrencyIcon: true },
  { href: '/admin/developer', label: 'Developer', icon: Plug },
  { href: '/admin/integrations', label: 'Integrations', icon: Plug },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/audit-log', label: 'Audit log', icon: FileText },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const tenant = useAuthStore((s) => s.tenant)

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-56 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <Link href="/admin" className="font-semibold text-lg">
            Tenant Admin
          </Link>
        </div>
        <nav className="p-2 flex-1 space-y-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {item.useCurrencyIcon ? (
                <BillingIcon currency={tenant?.defaultCurrency} className="h-4 w-4 shrink-0" />
              ) : (
                <item.icon className="h-4 w-4 shrink-0" />
              )}
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Tenant Admin" subtitle={tenant?.name ? `Business administration - ${tenant.name}` : 'Business administration'} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
