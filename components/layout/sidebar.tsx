'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { usePayAidAuth } from '@/lib/hooks/use-payaid-auth'
import { cn } from '@/lib/utils/cn'
import { useState, useMemo } from 'react'
import { getModuleLink, requiresSSO } from '@/lib/navigation/module-navigation'
import { useDashboardUrl } from '@/lib/utils/dashboard-url'
import { XIcon } from 'lucide-react'

// Core Navigation - Always visible, single-click access
// NOTE: Products and Orders removed from CRM (moved to Sales/Inventory modules per decoupled architecture)
const mainNavigation = [
  // Dashboard link removed - using decoupled architecture (/home for module selection)
  { name: 'Contacts', href: '/dashboard/contacts', icon: '👥', module: 'crm' },
  { name: 'Deals', href: '/dashboard/deals', icon: '💼', module: 'crm' },
  { name: 'Invoices', href: '/dashboard/invoices', icon: '🧾', module: 'finance' }, // Finance
]

// 9 Logical Modules - Collapsible sections
const navigationSections = [
  {
    name: 'CRM Module',
    icon: '👥',
    items: [
      { name: 'Contacts', href: '/dashboard/contacts', icon: '👥', module: 'crm' },
      { name: 'Deals', href: '/dashboard/deals', icon: '💼', module: 'crm' },
      { name: 'Tasks', href: '/dashboard/tasks', icon: '✅', module: 'crm' },
      // NOTE: Products moved to Inventory module, Orders moved to Sales module, Projects moved to Projects module
    ],
  },
  {
    name: 'Sales & Ecommerce',
    icon: '💰',
    items: [
      { name: 'Landing Pages', href: '/dashboard/landing-pages', icon: '📄', module: 'sales' },
      { name: 'Checkout Pages', href: '/dashboard/checkout-pages', icon: '💳', module: 'sales' },
      { name: 'Orders', href: '/dashboard/orders', icon: '🛒', module: 'sales' }, // Ecommerce orders
    ],
  },
  {
    name: 'Finance & Accounting',
    icon: '💼',
    items: [
      { name: 'Accounting', href: '/dashboard/accounting', icon: '💰', module: 'finance' },
      { name: 'Expenses', href: '/dashboard/accounting/expenses', icon: '💸', module: 'finance' },
      { name: 'Revenue Dashboard', href: '/dashboard/accounting/reports/revenue', icon: '📊', module: 'finance' },
      { name: 'Expense Dashboard', href: '/dashboard/accounting/reports/expenses', icon: '📉', module: 'finance' },
      { name: 'Accounting Reports', href: '/dashboard/accounting/reports', icon: '📋', module: 'finance' },
      { name: 'Purchase Orders', href: '/dashboard/purchases/orders', icon: '🛒', module: 'finance' },
      { name: 'Vendors', href: '/dashboard/purchases/vendors', icon: '🏢', module: 'finance' },
      { name: 'Billing', href: '/dashboard/billing', icon: '💳', module: null },
      { name: 'Invoices', href: '/dashboard/invoices', icon: '🧾', module: 'finance' }, // Cross-linked
    ],
  },
  {
    name: 'Marketing',
    icon: '📢',
    items: [
      { name: 'Campaigns', href: '/dashboard/marketing/campaigns', icon: '📢', module: 'marketing' },
      { name: 'Marketing Analytics', href: '/dashboard/marketing/analytics', icon: '📊', module: 'marketing' },
      { name: 'Segments', href: '/dashboard/marketing/segments', icon: '🎯', module: 'marketing' },
      { name: 'Social Media', href: '/dashboard/marketing/social', icon: '📱', module: 'marketing' },
      { name: 'Media Library', href: '/dashboard/media-library', icon: '🖼️', module: 'marketing' },
      { name: 'Email Templates', href: '/dashboard/email-templates', icon: '✉️', module: 'marketing' },
      { name: 'Events', href: '/dashboard/events', icon: '🎉', module: 'marketing' },
    ],
  },
  {
    name: 'Communication',
    icon: '💬',
    items: [
      { name: 'WhatsApp Setup', href: '/dashboard/whatsapp/setup', icon: '⚡', module: 'communication' },
      { name: 'WhatsApp Accounts', href: '/dashboard/whatsapp/accounts', icon: '📱', module: 'communication' },
      { name: 'WhatsApp Inbox', href: '/dashboard/whatsapp/inbox', icon: '📥', module: 'communication' },
      { name: 'WhatsApp Sessions', href: '/dashboard/whatsapp/sessions', icon: '🔗', module: 'communication' },
      { name: 'Email Accounts', href: '/dashboard/email/accounts', icon: '📧', module: 'communication' },
      { name: 'Webmail', href: '/dashboard/email/webmail', icon: '✉️', module: 'communication' },
      { name: 'Team Chat', href: '/dashboard/chat', icon: '💬', module: 'communication' },
    ],
  },
  {
    name: 'AI Features',
    icon: '🤖',
    items: [
      { name: 'AI Co-founder', href: '/ai-cofounder', icon: '🤖', module: 'ai-cofounder' },
      { name: 'AI Chat', href: '/ai-chat', icon: '💬', module: 'ai-chat' },
      { name: 'AI Insights', href: '/ai-insights', icon: '💡', module: 'ai-insights' },
      { name: 'Website Builder', href: '/website-builder', icon: '🌐', module: 'website-builder' },
      { name: 'Logo Generator', href: '/logo-generator', icon: '🎨', module: 'logo-generator' },
      { name: 'Knowledge & RAG AI', href: '/knowledge-rag', icon: '📚', module: 'knowledge-rag' },
      { name: 'AI Calling Bot', href: '/voice-agents', icon: '📞', module: 'voice-agents', comingSoon: true },
    ],
  },
  {
    name: 'Productivity Suite',
    icon: '💼',
    items: [
      { name: 'Spreadsheets', href: '/dashboard/spreadsheets', icon: '📊', module: 'productivity' },
      { name: 'Documents', href: '/dashboard/docs', icon: '📄', module: 'productivity' },
      { name: 'Slides', href: '/dashboard/slides', icon: '📽️', module: 'productivity' },
      { name: 'Drive', href: '/dashboard/drive', icon: '📁', module: 'productivity' },
      { name: 'Meet', href: '/dashboard/meet', icon: '📹', module: 'productivity' },
      { name: 'PDF Tools', href: '/dashboard/pdf', icon: '📑', module: 'productivity' },
    ],
  },
  {
    name: 'HR & Payroll',
    icon: '👔',
    items: [
      { name: 'Employees', href: '/dashboard/hr/employees', icon: '👔', module: 'hr' },
      { name: 'Attendance', href: '/dashboard/hr/attendance/calendar', icon: '📅', module: 'hr' },
      { name: 'Check-in/Check-out', href: '/dashboard/hr/attendance/check-in', icon: '✅', module: 'hr' },
      { name: 'Leave Management', href: '/dashboard/hr/leave/requests', icon: '🏖️', module: 'hr' },
      { name: 'Leave Balances', href: '/dashboard/hr/leave/balances', icon: '📊', module: 'hr' },
      { name: 'Apply Leave', href: '/dashboard/hr/leave/apply', icon: '📝', module: 'hr' },
      { name: 'Hiring', href: '/dashboard/hr/hiring/job-requisitions', icon: '📝', module: 'hr' },
      { name: 'Candidates', href: '/dashboard/hr/hiring/candidates', icon: '👤', module: 'hr' },
      { name: 'Interviews', href: '/dashboard/hr/hiring/interviews', icon: '💼', module: 'hr' },
      { name: 'Offers', href: '/dashboard/hr/hiring/offers', icon: '📄', module: 'hr' },
      { name: 'Onboarding', href: '/dashboard/hr/onboarding/instances', icon: '🚀', module: 'hr' },
      { name: 'Onboarding Templates', href: '/dashboard/hr/onboarding/templates', icon: '📋', module: 'hr' },
      { name: 'Payroll', href: '/dashboard/hr/payroll/cycles', icon: '💰', module: 'hr' },
      { name: 'Salary Structures', href: '/dashboard/hr/payroll/salary-structures', icon: '💵', module: 'hr' },
      { name: 'Payroll Reports', href: '/dashboard/hr/payroll/reports', icon: '📈', module: 'hr' },
      { name: 'Tax Declarations', href: '/dashboard/hr/tax-declarations', icon: '📑', module: 'hr' },
    ],
  },
  {
    name: 'Reports & Analytics',
    icon: '📊',
    items: [
      { name: 'Advanced Reporting', href: '/dashboard/reports', icon: '📈', module: 'analytics' },
      { name: 'Custom Dashboards', href: '/dashboard/dashboards/custom', icon: '📊', module: 'analytics' },
      { name: 'Analytics', href: '/dashboard/analytics', icon: '📈', module: 'analytics' },
      { name: 'GST Reports', href: '/dashboard/gst/gstr-1', icon: '📋', module: 'finance' },
      { name: 'GSTR-3B', href: '/dashboard/gst/gstr-3b', icon: '📄', module: 'finance' },
      { name: 'GST Hub', href: '/dashboard/gst', icon: '🏛️', module: 'finance' },
    ],
  },
  {
    name: 'Industries',
    icon: '🏭',
    items: [
      { name: 'Industries Hub', href: '/dashboard/industries', icon: '🏭', module: null },
      { name: 'Industry Setup', href: '/dashboard/setup/industry', icon: '⚙️', module: null },
      { name: 'Business Units', href: '/dashboard/business-units', icon: '🏢', module: null },
      // Existing Industries
      { name: 'Restaurant - Orders', href: '/dashboard/industries/restaurant/orders', icon: '📋', module: null },
      { name: 'Restaurant - Menu', href: '/dashboard/industries/restaurant/menu', icon: '🍽️', module: null },
      { name: 'Restaurant - Kitchen', href: '/dashboard/industries/restaurant/kitchen', icon: '👨‍🍳', module: null },
      { name: 'Restaurant - Tables', href: '/dashboard/industries/restaurant/tables', icon: '🪑', module: null },
      { name: 'Restaurant - Reservations', href: '/dashboard/industries/restaurant/reservations', icon: '📅', module: null },
      { name: 'Retail - Products', href: '/dashboard/industries/retail/products', icon: '🛒', module: null },
      // Phase 1: Critical Gaps
      { name: 'Healthcare - Prescriptions', href: '/dashboard/industries/healthcare/prescriptions', icon: '💊', module: null },
      { name: 'Healthcare - Lab Tests', href: '/dashboard/industries/healthcare/lab-tests', icon: '🧪', module: null },
      { name: 'Education - Students', href: '/dashboard/industries/education/students', icon: '🎓', module: null },
      { name: 'Education - Courses', href: '/dashboard/industries/education/courses', icon: '📚', module: null },
      { name: 'Real Estate - Leads', href: '/dashboard/industries/real-estate/leads', icon: '🏠', module: null },
      { name: 'Logistics - Shipments', href: '/dashboard/industries/logistics/shipments', icon: '🚚', module: null },
      // Phase 2: High Value
      { name: 'Agriculture - Crops', href: '/dashboard/industries/agriculture/crops', icon: '🌾', module: null },
      { name: 'Construction - Projects', href: '/dashboard/industries/construction/projects', icon: '🏗️', module: null },
      { name: 'Beauty - Appointments', href: '/dashboard/industries/beauty/appointments', icon: '💅', module: null },
      { name: 'Automotive - Job Cards', href: '/dashboard/industries/automotive/job-cards', icon: '🔧', module: null },
      // Phase 3: Market Expansion
      { name: 'Hospitality - Bookings', href: '/dashboard/industries/hospitality/bookings', icon: '🏨', module: null },
      { name: 'Legal - Cases', href: '/dashboard/industries/legal/cases', icon: '⚖️', module: null },
      { name: 'Financial - Tax Filings', href: '/dashboard/industries/financial/tax-filings', icon: '💰', module: null },
      { name: 'Events - Management', href: '/dashboard/industries/events/events', icon: '🎉', module: null },
      { name: 'Wholesale - Customers', href: '/dashboard/industries/wholesale/customers', icon: '📦', module: null },
    ],
  },
]

function NavItem({ 
  item, 
  isActive,
  onLinkClick
}: { 
  item: { name: string; href: string; icon: string; module?: string | null; comingSoon?: boolean }
  isActive: boolean
  onLinkClick?: () => void
}) {
  const { tenant } = useAuthStore()
  const tenantId = tenant?.id
  
  // Check if we're in production (not localhost)
  const isProduction = typeof window !== 'undefined' && 
    !window.location.hostname.includes('localhost') && 
    !window.location.hostname.includes('127.0.0.1')
  
  // Handle decoupled module routes
  let finalUrl = item.href
  if (item.module === 'ai-studio' && tenantId) {
    // AI Studio hub uses decoupled architecture: /ai-studio/[tenantId]/Home
    finalUrl = `/ai-studio/${tenantId}/Home`
  } else if (item.module === 'ai-cofounder' && tenantId) {
    finalUrl = `/ai-studio/${tenantId}/Cofounder`
  } else if (item.module === 'ai-chat' && tenantId) {
    finalUrl = `/ai-studio/${tenantId}/Chat`
  } else if (item.module === 'ai-insights' && tenantId) {
    finalUrl = `/ai-studio/${tenantId}/Insights`
  } else if (item.module === 'website-builder' && tenantId) {
    finalUrl = `/ai-studio/${tenantId}/Websites`
  } else if (item.module === 'logo-generator' && tenantId) {
    finalUrl = `/ai-studio/${tenantId}/Logos`
  } else if (item.module === 'knowledge-rag' && tenantId) {
    finalUrl = `/ai-studio/${tenantId}/Knowledge`
  } else if (item.module === 'voice-agents' && tenantId) {
    // Voice Agents uses decoupled architecture: /voice-agents/[tenantId]/Home
    finalUrl = `/voice-agents/${tenantId}/Home`
  } else {
    const dashboardUrl = useDashboardUrl(item.href || '/dashboard')
    
    // Use OAuth2 SSO navigation if module requires it
    const needsSSO = item.module ? requiresSSO(item.module) : false
    
    // If SSO is required, get module link (which may be external)
    // Otherwise, always use tenant-aware dashboard URL
    finalUrl = dashboardUrl
    if (needsSSO && item.module) {
      const moduleLink = getModuleLink(item.module, item.href)
      // If module link is external (starts with http), use it
      // Otherwise, use tenant-aware URL
      finalUrl = moduleLink.startsWith('http') ? moduleLink : dashboardUrl
    }
  }
  
  // CRITICAL: Only render if licensed (filtered at parent level)
  // No locked badges - items are completely hidden if not licensed
  const handleClick = (e: React.MouseEvent) => {
    // Disable clicks for "Coming Soon" items in production
    if (item.comingSoon && isProduction) {
      e.preventDefault()
      return
    }
    
    if (onLinkClick && window.innerWidth < 1024) {
      onLinkClick()
    }
  }

  const isComingSoon = item.comingSoon && isProduction

  return (
    <Link
      href={isComingSoon ? '#' : finalUrl}
      onClick={handleClick}
      className={cn(
        'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] relative',
        isActive
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100',
        isComingSoon && 'opacity-60 cursor-not-allowed'
      )}
    >
      <span className="mr-3 text-lg">{item.icon}</span>
      <span className="flex-1">{item.name}</span>
      {isComingSoon && (
        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded">
          Coming Soon
        </span>
      )}
    </Link>
  )
}


function NavSection({ section, pathname, onLinkClick }: { section: typeof navigationSections[0]; pathname: string; onLinkClick?: () => void }) {
  const { tenant } = useAuthStore()
  const { hasModule, licensedModules } = usePayAidAuth()
  const tenantId = tenant?.id
  
  // Helper to check if path matches (accounting for tenantId in URL)
  const isPathActive = (item: { name: string; href: string; icon: string; module?: string | null; comingSoon?: boolean }) => {
    const href = item?.href
    if (!href || typeof href !== 'string') {
      return false
    }
    
    // Handle decoupled module routes
    if (item.module === 'ai-studio' && tenantId) {
      return pathname?.startsWith(`/ai-studio/${tenantId}`)
    }
    if (item.module === 'ai-cofounder' && tenantId) {
      return pathname?.includes('/Cofounder')
    }
    if (item.module === 'ai-chat' && tenantId) {
      return pathname?.includes('/Chat')
    }
    if (item.module === 'ai-insights' && tenantId) {
      return pathname?.includes('/Insights')
    }
    if (item.module === 'website-builder' && tenantId) {
      return pathname?.includes('/Websites')
    }
    if (item.module === 'logo-generator' && tenantId) {
      return pathname?.includes('/Logos')
    }
    if (item.module === 'knowledge-rag' && tenantId) {
      return pathname?.includes('/Knowledge')
    }
    if (item.module === 'voice-agents' && tenantId) {
      return pathname?.startsWith(`/voice-agents/${tenantId}`)
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
          'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px]',
          hasActiveItem
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
        )}
      >
        <div className="flex items-center flex-1 min-w-0">
          <span className="mr-3 text-lg shrink-0">{section.icon}</span>
          <span className="truncate">{section.name}</span>
        </div>
        <svg
          className={cn(
            'w-4 h-4 transition-transform shrink-0 ml-2',
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
                onLinkClick={onLinkClick}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
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
  // Sidebar shows ONLY licensed modules (no locked badges)
  // Admin users can manage modules through admin panel, but sidebar still shows only licensed ones
  const licensedMainNav = mainNavigation.filter(item => 
    !item.module || hasModule(item.module)
  )

  // Check if user is admin/owner (admins have access to module management panel)
  const isAdmin = user?.role === 'owner' || user?.role === 'admin'
  
  // Total available modules (9 logical modules in new structure)
  const totalModules = 9
  const hasAllModules = licensedModules.length >= totalModules

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-64 overflow-y-auto relative transition-colors">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">PayAid V3</h1>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] transition-colors"
          aria-label="Close sidebar"
        >
          <XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </button>
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
                  onLinkClick={onClose}
                />
              )
            })}
          </div>
        )}

        {/* Divider */}
        {licensedMainNav.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
        )}

        {/* Grouped Sections - Automatically filtered by NavSection */}
        <div className="space-y-1">
          {navigationSections.map((section) => (
            <NavSection key={section.name} section={section} pathname={pathname} onLinkClick={onClose} />
          ))}
        </div>

        {/* Admin & Settings */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2 space-y-1">
          {isAdmin && (
            <NavItem
              item={{ name: 'Module Management', href: '/dashboard/admin/modules', icon: '🔧', module: null }}
              isActive={isPathActive('/dashboard/admin/modules')}
              onLinkClick={onClose}
            />
          )}
          <NavItem
            item={{ name: 'Settings', href: '/dashboard/settings', icon: '⚙️', module: null }}
            isActive={isPathActive('/dashboard/settings')}
            onLinkClick={onClose}
          />
        </div>

        {/* CRITICAL: Add Modules Button - Only show if user doesn't have all modules */}
        {!hasAllModules && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
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
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
            <div className="px-3 py-2 text-xs text-center text-gray-500 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 rounded-md">
              ✓ All Modules Active
            </div>
          </div>
        )}
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
            href={tenantId ? `/home/${tenantId}` : '/home'}
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
