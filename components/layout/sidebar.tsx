'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { usePayAidAuth } from '@/lib/hooks/use-payaid-auth'
import { cn } from '@/lib/utils/cn'
import { useState, useMemo } from 'react'
import { getModuleLink, requiresSSO } from '@/lib/navigation/module-navigation'
import { useDashboardUrl } from '@/lib/utils/dashboard-url'

// Main navigation items (most frequently used)
// Map to module IDs for license checking (V2 - 8 Module Structure)
const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', module: null }, // Always accessible
  { name: 'Contacts', href: '/dashboard/contacts', icon: '👥', module: 'crm' },
  { name: 'Deals', href: '/dashboard/deals', icon: '💼', module: 'crm' },
  { name: 'Invoices', href: '/dashboard/invoices', icon: '🧾', module: 'finance' }, // Updated: invoicing → finance
  { name: 'Products', href: '/dashboard/products', icon: '📦', module: 'crm' }, // Shared with Sales
  { name: 'Orders', href: '/dashboard/orders', icon: '🛒', module: 'crm' }, // Shared with Sales
]

// Grouped navigation sections (V2 - 8 Module Structure)
// Map items to module IDs for license checking
const navigationSections = [
  {
    name: 'Sales',
    icon: '💼',
    items: [
      { name: 'Landing Pages', href: '/dashboard/landing-pages', icon: '📄', module: 'sales' },
      { name: 'Checkout Pages', href: '/dashboard/checkout-pages', icon: '💳', module: 'sales' },
      { name: 'Orders', href: '/dashboard/orders', icon: '🛒', module: 'sales' }, // Ecommerce orders
    ],
  },
  {
    name: 'Sales & Operations',
    icon: '💼',
    items: [
      { name: 'Projects', href: '/dashboard/projects', icon: '📁', module: 'crm' }, // NEW: Project Management
      { name: 'Tasks', href: '/dashboard/tasks', icon: '✅', module: 'crm' },
      { name: 'Accounting', href: '/dashboard/accounting', icon: '💰', module: 'finance' }, // Updated: accounting → finance
      { name: 'Purchase Orders', href: '/dashboard/purchases/orders', icon: '🛒', module: 'finance' }, // NEW: Purchase Orders
      { name: 'Vendors', href: '/dashboard/purchases/vendors', icon: '🏢', module: 'finance' }, // NEW: Vendor Management
      { name: 'Analytics', href: '/dashboard/analytics', icon: '📈', module: 'analytics' },
    ],
  },
  {
    name: 'Marketing',
    icon: '📢',
    items: [
      { name: 'Campaigns', href: '/dashboard/marketing/campaigns', icon: '📢', module: 'marketing' }, // Updated: crm → marketing
      { name: 'Social Media', href: '/dashboard/marketing/social', icon: '📱', module: 'marketing' }, // Updated: crm → marketing
      { name: 'Email Templates', href: '/dashboard/email-templates', icon: '✉️', module: 'marketing' }, // Updated: crm → marketing
      { name: 'Events', href: '/dashboard/events', icon: '🎉', module: 'marketing' }, // Updated: crm → marketing
      { name: 'Setup WhatsApp', href: '/dashboard/whatsapp/setup', icon: '⚡', module: 'marketing' }, // Updated: whatsapp → marketing
      { name: 'WhatsApp Accounts', href: '/dashboard/whatsapp/accounts', icon: '📱', module: 'marketing' }, // Updated: whatsapp → marketing
      { name: 'WhatsApp Inbox', href: '/dashboard/whatsapp/inbox', icon: '📥', module: 'marketing' }, // Updated: whatsapp → marketing
      { name: 'WhatsApp Sessions', href: '/dashboard/whatsapp/sessions', icon: '🔗', module: 'marketing' }, // Updated: whatsapp → marketing
    ],
  },
  {
    name: 'Communication',
    icon: '💬',
    items: [
      { name: 'Email Accounts', href: '/dashboard/email/accounts', icon: '📧', module: 'communication' }, // Updated: crm → communication
      { name: 'Webmail', href: '/dashboard/email/webmail', icon: '✉️', module: 'communication' }, // Updated: crm → communication
      { name: 'Team Chat', href: '/dashboard/chat', icon: '💬', module: 'communication' }, // Updated: crm → communication
    ],
  },
  {
    name: 'AI Studio',
    icon: '🤖',
    items: [
      { name: 'Websites', href: '/dashboard/websites', icon: '🌐', module: 'ai-studio' }, // Updated: crm → ai-studio
      { name: 'Logo Generator', href: '/dashboard/logos', icon: '🎨', module: 'ai-studio' }, // Updated: crm → ai-studio
      { name: 'AI Chat', href: '/dashboard/ai/chat', icon: '💬', module: 'ai-studio' }, // Updated: analytics → ai-studio
      { name: 'Knowledge & RAG AI', href: '/dashboard/knowledge', icon: '📚', module: 'ai-studio' }, // NEW: Knowledge & RAG AI
      { name: 'AI Calling Bot', href: '/dashboard/calls', icon: '📞', module: 'ai-studio' }, // Updated: analytics → ai-studio
    ],
  },
  {
    name: 'HR & Payroll',
    icon: '👔',
    items: [
      { name: 'Employees', href: '/dashboard/hr/employees', icon: '👔', module: 'hr' },
      { name: 'Hiring', href: '/dashboard/hr/hiring/job-requisitions', icon: '📝', module: 'hr' },
      { name: 'Payroll', href: '/dashboard/hr/payroll/cycles', icon: '💰', module: 'hr' },
      { name: 'Reports', href: '/dashboard/hr/payroll/reports', icon: '📈', module: 'hr' },
    ],
  },
  {
    name: 'Reports & Tools',
    icon: '📊',
    items: [
      { name: 'GST Reports', href: '/dashboard/gst/gstr-1', icon: '📋', module: 'finance' }, // Updated: accounting → finance
      { name: 'Custom Reports', href: '/dashboard/reports', icon: '📈', module: 'analytics' }, // NEW: Advanced Reporting
      { name: 'Custom Dashboards', href: '/dashboard/dashboards/custom', icon: '📊', module: 'analytics' },
    ],
  },
]

function NavItem({ 
  item, 
  isActive
}: { 
  item: { name: string; href: string; icon: string; module?: string | null }
  isActive: boolean
}) {
  const dashboardUrl = useDashboardUrl(item.href || '/dashboard')
  
  // Use OAuth2 SSO navigation if module requires it
  const needsSSO = item.module ? requiresSSO(item.module) : false
  
  // If SSO is required, get module link (which may be external)
  // Otherwise, always use tenant-aware dashboard URL
  let finalUrl = dashboardUrl
  if (needsSSO && item.module) {
    const moduleLink = getModuleLink(item.module, item.href)
    // If module link is external (starts with http), use it
    // Otherwise, use tenant-aware URL
    finalUrl = moduleLink.startsWith('http') ? moduleLink : dashboardUrl
  }
  
  // CRITICAL: Only render if licensed (filtered at parent level)
  // No locked badges - items are completely hidden if not licensed
  return (
    <Link
      href={finalUrl}
      className={cn(
        'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      <span className="mr-3 text-lg">{item.icon}</span>
      {item.name}
    </Link>
  )
}

function NavSection({ section, pathname }: { section: typeof navigationSections[0]; pathname: string }) {
  const { tenant } = useAuthStore()
  const { hasModule, licensedModules } = usePayAidAuth()
  const tenantId = tenant?.id
  
  // Helper to check if path matches (accounting for tenantId in URL)
  const isPathActive = (item: { name: string; href: string; icon: string; module?: string | null }) => {
    const href = item?.href
    if (!href || typeof href !== 'string') {
      return false
    }
    if (!tenantId) {
      return pathname === href || pathname?.startsWith(href + '/')
    }
    const tenantHref = `/dashboard/${tenantId}${href.replace(/^\/dashboard/, '')}`
    return pathname === tenantHref || pathname?.startsWith(tenantHref + '/')
  }
  
  // CRITICAL: Filter items to show ONLY licensed ones (or items without module requirement)
  const licensedItems = section.items.filter(item => 
    !item.module || hasModule(item.module)
  )
  
  // Move useState before conditional return to follow React Hooks rules
  const [isOpen, setIsOpen] = useState(() => {
    // Auto-expand if any item in section is active
    return licensedItems.some(isPathActive)
  })
  
  // CRITICAL: Hide entire section if no licensed items
  if (licensedItems.length === 0) {
    return null
  }

  const hasActiveItem = licensedItems.some(isPathActive)

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
          hasActiveItem
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        )}
      >
        <div className="flex items-center">
          <span className="mr-3 text-lg">{section.icon}</span>
          <span>{section.name}</span>
        </div>
        <svg
          className={cn(
            'w-4 h-4 transition-transform',
            isOpen ? 'transform rotate-180' : ''
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="ml-4 space-y-1">
          {licensedItems.map((item) => {
            const isActive = isPathActive(item)
            return (
              <NavItem 
                key={item.href} 
                item={item} 
                isActive={isActive}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, tenant, logout } = useAuthStore()
  const { hasModule, licensedModules } = usePayAidAuth()
  const tenantId = tenant?.id

  // Helper to check if path matches (accounting for tenantId in URL)
  const isPathActive = (item: { name: string; href: string; icon: string } | string) => {
    // Handle both item object and href string for compatibility
    const href = typeof item === 'string' ? item : item?.href
    if (!href || typeof href !== 'string') {
      return false
    }
    if (!tenantId) {
      return pathname === href || pathname?.startsWith(href + '/')
    }
    const tenantHref = `/dashboard/${tenantId}${href.replace(/^\/dashboard/, '')}`
    return pathname === tenantHref || pathname?.startsWith(tenantHref + '/')
  }

  // CRITICAL: Filter main navigation to show ONLY licensed items (or items without module requirement)
  // Following Zoho-like architecture: Sidebar shows ONLY licensed modules (no locked badges)
  // Admin users can manage modules through admin panel, but sidebar still shows only licensed ones
  const licensedMainNav = mainNavigation.filter(item => 
    !item.module || hasModule(item.module)
  )

  // Check if user is admin/owner (admins have access to module management panel)
  const isAdmin = user?.role === 'owner' || user?.role === 'admin'
  
  // Total available modules (8 in V2 structure)
  const totalModules = 8
  const hasAllModules = licensedModules.length >= totalModules

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">PayAid V3</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {/* Main Navigation - ONLY show licensed items */}
        {licensedMainNav.length > 0 && (
          <div className="space-y-1">
            {licensedMainNav.map((item) => {
              const isActive = isPathActive(item.href)
              return (
                <NavItem 
                  key={item.href} 
                  item={item} 
                  isActive={isActive}
                />
              )
            })}
          </div>
        )}

        {/* Divider */}
        {licensedMainNav.length > 0 && (
          <div className="border-t border-gray-200 my-2"></div>
        )}

        {/* Grouped Sections - Automatically filtered by NavSection */}
        <div className="space-y-1">
          {navigationSections.map((section) => (
            <NavSection key={section.name} section={section} pathname={pathname} />
          ))}
        </div>

        {/* Admin & Settings */}
        <div className="pt-2 border-t border-gray-200 mt-2 space-y-1">
          {isAdmin && (
            <NavItem
              item={{ name: 'Module Management', href: '/dashboard/admin/modules', icon: '🔧', module: null }}
              isActive={isPathActive('/dashboard/admin/modules')}
            />
          )}
          <NavItem
            item={{ name: 'Settings', href: '/dashboard/settings', icon: '⚙️', module: null }}
            isActive={isPathActive('/dashboard/settings')}
          />
        </div>

        {/* CRITICAL: Add Modules Button - Only show if user doesn't have all modules */}
        {!hasAllModules && (
          <div className="pt-2 border-t border-gray-200 mt-2">
            <Link
              href="/dashboard/admin/modules"
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                'bg-[#F5C700] text-[#53328A] hover:bg-[#E0B200] text-center justify-center'
              )}
            >
              <span className="mr-2">+</span>
              Add Modules
            </Link>
          </div>
        )}

        {/* Show badge if user has all modules */}
        {hasAllModules && (
          <div className="pt-2 border-t border-gray-200 mt-2">
            <div className="px-3 py-2 text-xs text-center text-gray-500 bg-green-50 rounded-md">
              ✓ All Modules Active
            </div>
          </div>
        )}
      </nav>

      {/* User Info */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center mb-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {user?.name?.[0]?.toUpperCase() || user?.email[0]?.toUpperCase()}
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || user?.email}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {tenant?.name}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
