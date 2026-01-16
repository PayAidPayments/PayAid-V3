'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { usePayAidAuth } from '@/lib/hooks/use-payaid-auth'
import { cn } from '@/lib/utils/cn'
import { useDashboardUrl } from '@/lib/utils/dashboard-url'
import { XIcon, ArrowLeft } from 'lucide-react'

// CRM Module Navigation - Only CRM features (Decoupled Architecture)
// Removed: Projects (→ Projects module), Orders (→ Sales module), Products (→ Inventory module)
const crmNavigation = [
  { name: 'Home', href: '/dashboard', icon: '📊', module: null },
  { name: 'Leads', href: '/dashboard/leads', icon: '🎯', module: 'crm' },
  { name: 'Contacts', href: '/dashboard/contacts', icon: '👥', module: 'crm' },
  { name: 'Accounts', href: '/dashboard/accounts', icon: '🏢', module: 'crm' },
  { name: 'Deals', href: '/dashboard/deals', icon: '💼', module: 'crm' },
  { name: 'Tasks', href: '/dashboard/tasks', icon: '✅', module: 'crm' },
  { name: 'Reports', href: '/dashboard/reports', icon: '📈', module: 'crm' },
]

function NavItem({ 
  item, 
  isActive,
  onLinkClick
}: { 
  item: { name: string; href: string; icon: string; module?: string | null }
  isActive: boolean
  onLinkClick?: () => void
}) {
  const dashboardUrl = useDashboardUrl(item.href || '/dashboard')
  
  const handleClick = () => {
    if (onLinkClick && window.innerWidth < 1024) {
      onLinkClick()
    }
  }

  return (
    <Link
      href={dashboardUrl}
      onClick={handleClick}
      className={cn(
        'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px]',
        isActive
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
      )}
    >
      <span className="mr-3 text-lg">{item.icon}</span>
      {item.name}
    </Link>
  )
}

export function CRMSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const { user, tenant, logout } = useAuthStore()
  const { hasModule } = usePayAidAuth()
  const tenantId = tenant?.id

  // Helper to check if path matches
  const isPathActive = (href: string) => {
    if (!href || typeof href !== 'string') return false
    if (!tenantId) {
      return pathname === href || pathname?.startsWith(href + '/')
    }
    const tenantHref = `/dashboard/${tenantId}${href.replace(/^\/dashboard/, '')}`
    return pathname === tenantHref || pathname?.startsWith(tenantHref + '/')
  }

  // Filter to show only licensed CRM items
  const licensedNav = crmNavigation.filter(item => 
    !item.module || hasModule(item.module)
  )

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-64 overflow-y-auto relative transition-colors">
      {/* Logo & Back to Apps */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">CRM</h1>
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] transition-colors"
          aria-label="Close sidebar"
        >
          <XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Back to Apps Button */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <Link
          href="/home"
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Apps
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        <div className="space-y-1">
          {licensedNav.map((item) => {
            const isActive = isPathActive(item.href)
            return (
              <NavItem 
                key={item.href} 
                item={item} 
                isActive={isActive}
                onLinkClick={onClose}
              />
            )
          })}
        </div>

        {/* Settings */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2 space-y-1">
          <NavItem
            item={{ name: 'Settings', href: '/dashboard/settings', icon: '⚙️', module: null }}
            isActive={isPathActive('/dashboard/settings')}
            onLinkClick={onClose}
          />
        </div>
      </nav>

      {/* User Info */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center mb-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold">
              {user?.name?.[0]?.toUpperCase() || user?.email[0]?.toUpperCase()}
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {user?.name || user?.email}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {tenant?.name}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <Link
            href={tenantId ? `/dashboard/${tenantId}/settings/profile` : '/dashboard/settings/profile'}
            onClick={() => {
              if (onClose && window.innerWidth < 1024) {
                onClose()
              }
            }}
            className="w-full block text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Profile Settings
          </Link>
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

