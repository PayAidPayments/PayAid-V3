'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { usePayAidAuth } from '@/lib/hooks/use-payaid-auth'
import { cn } from '@/lib/utils/cn'
import { useState, useMemo } from 'react'
import { getModuleLink, requiresSSO } from '@/lib/navigation/module-navigation'
import { useDashboardUrl } from '@/lib/utils/dashboard-url'
import { 
  XIcon,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Receipt,
  BarChart3,
  TrendingDown,
  ClipboardList,
  Building2,
  Megaphone,
  Target,
  Smartphone,
  Image,
  Mail,
  PartyPopper,
  MessageSquare,
  Zap,
  Link as LinkIcon,
  Bot,
  Lightbulb,
  Globe,
  Palette,
  BookOpen,
  Phone,
  Settings,
  CheckSquare,
  Calendar,
  Plane,
  FileEdit,
  UserCircle,
  Rocket,
  Wallet,
  FileSpreadsheet,
  Presentation,
  Folder,
  Video,
  FileCheck,
  Wrench,
  Factory,
  Scale,
  Package,
  Cog,
  LayoutDashboard,
  Search,
  Bell,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  ChevronDown,
  Plus
} from 'lucide-react'

// Icon mapping for navigation items
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'contacts': Users,
  'deals': Briefcase,
  'invoices': Receipt,
  'tasks': CheckSquare,
  'landing-pages': FileText,
  'checkout-pages': CreditCard,
  'orders': ShoppingCart,
  'accounting': Scale,
  'expenses': TrendingDown,
  'revenue': BarChart3,
  'reports': ClipboardList,
  'purchase-orders': ShoppingCart,
  'vendors': Building2,
  'billing': CreditCard,
  'campaigns': Megaphone,
  'analytics': BarChart3,
  'segments': Target,
  'social-media': Smartphone,
  'media-library': Image,
  'email-templates': Mail,
  'events': PartyPopper,
  'whatsapp': MessageSquare,
  'email': Mail,
  'chat': MessageSquare,
  'ai-cofounder': Bot,
  'ai-chat': MessageSquare,
  'ai-insights': Lightbulb,
  'website-builder': Globe,
  'logo-generator': Palette,
  'knowledge-rag': BookOpen,
  'voice-agents': Phone,
  'spreadsheets': FileSpreadsheet,
  'documents': FileText,
  'slides': Presentation,
  'drive': Folder,
  'meet': Video,
  'pdf': FileCheck,
  'employees': Users,
  'attendance': Calendar,
  'check-in': CheckSquare,
  'leave': Plane,
  'hiring': FileEdit,
  'candidates': UserCircle,
  'interviews': Briefcase,
  'offers': FileText,
  'onboarding': Rocket,
  'payroll': Wallet,
  'salary': DollarSign,
  'tax': FileText,
  'reports-analytics': BarChart3,
  'custom-dashboards': LayoutDashboard,
  'gst': FileText,
  'industries': Factory,
  'settings': Settings,
  'module-management': Wrench,
  'crm': Users,
  'sales': TrendingUp,
  'finance': Scale,
  'marketing': Megaphone,
  'communication': MessageSquare,
  'productivity': FileText,
  'hr': Users,
  'analytics': BarChart3,
}

// Core Navigation - Always visible, single-click access
// NOTE: Products and Orders removed from CRM (moved to Sales/Inventory modules per decoupled architecture)
const mainNavigation = [
  // Dashboard link removed - using decoupled architecture (/home for module selection)
  { name: 'Contacts', href: '/dashboard/contacts', icon: 'contacts', module: 'crm' },
  { name: 'Deals', href: '/dashboard/deals', icon: 'deals', module: 'crm' },
  { name: 'Invoices', href: '/dashboard/invoices', icon: 'invoices', module: 'finance' }, // Finance
]

// 9 Logical Modules - Collapsible sections
const navigationSections = [
  {
    name: 'CRM Module',
    icon: 'contacts',
    items: [
      { name: 'Contacts', href: '/dashboard/contacts', icon: 'contacts', module: 'crm' },
      { name: 'Deals', href: '/dashboard/deals', icon: 'deals', module: 'crm' },
      { name: 'Tasks', href: '/dashboard/tasks', icon: 'tasks', module: 'crm' },
      // NOTE: Products moved to Inventory module, Orders moved to Sales module, Projects moved to Projects module
    ],
  },
  {
    name: 'Sales & Ecommerce',
    icon: 'orders',
    items: [
      { name: 'Landing Pages', href: '/dashboard/landing-pages', icon: 'landing-pages', module: 'sales' },
      { name: 'Checkout Pages', href: '/dashboard/checkout-pages', icon: 'checkout-pages', module: 'sales' },
      { name: 'Orders', href: '/dashboard/orders', icon: 'orders', module: 'sales' }, // Ecommerce orders
    ],
  },
  {
    name: 'Finance & Accounting',
    icon: 'accounting',
    items: [
      { name: 'Accounting', href: '/dashboard/accounting', icon: 'accounting', module: 'finance' },
      { name: 'Expenses', href: '/dashboard/accounting/expenses', icon: 'expenses', module: 'finance' },
      { name: 'Revenue Dashboard', href: '/dashboard/accounting/reports/revenue', icon: 'revenue', module: 'finance' },
      { name: 'Expense Dashboard', href: '/dashboard/accounting/reports/expenses', icon: 'expenses', module: 'finance' },
      { name: 'Accounting Reports', href: '/dashboard/accounting/reports', icon: 'reports', module: 'finance' },
      { name: 'Purchase Orders', href: '/dashboard/purchases/orders', icon: 'purchase-orders', module: 'finance' },
      { name: 'Vendors', href: '/dashboard/purchases/vendors', icon: 'vendors', module: 'finance' },
      { name: 'Billing', href: '/dashboard/billing', icon: 'billing', module: null },
      { name: 'Invoices', href: '/dashboard/invoices', icon: 'invoices', module: 'finance' }, // Cross-linked
    ],
  },
  {
    name: 'Marketing',
    icon: 'campaigns',
    items: [
      { name: 'Campaigns', href: '/dashboard/marketing/campaigns', icon: 'campaigns', module: 'marketing' },
      { name: 'Marketing Analytics', href: '/dashboard/marketing/analytics', icon: 'analytics', module: 'marketing' },
      { name: 'Segments', href: '/dashboard/marketing/segments', icon: 'segments', module: 'marketing' },
      { name: 'Social Media', href: '/dashboard/marketing/social', icon: 'social-media', module: 'marketing' },
      { name: 'Media Library', href: '/dashboard/media-library', icon: 'media-library', module: 'marketing' },
      { name: 'Email Templates', href: '/dashboard/email-templates', icon: 'email-templates', module: 'marketing' },
      { name: 'Events', href: '/dashboard/events', icon: 'events', module: 'marketing' },
    ],
  },
  {
    name: 'Communication',
    icon: 'chat',
    items: [
      { name: 'WhatsApp Setup', href: '/dashboard/whatsapp/setup', icon: 'whatsapp', module: 'communication' },
      { name: 'WhatsApp Accounts', href: '/dashboard/whatsapp/accounts', icon: 'whatsapp', module: 'communication' },
      { name: 'WhatsApp Inbox', href: '/dashboard/whatsapp/inbox', icon: 'whatsapp', module: 'communication' },
      { name: 'WhatsApp Sessions', href: '/dashboard/whatsapp/sessions', icon: 'whatsapp', module: 'communication' },
      { name: 'Email Accounts', href: '/dashboard/email/accounts', icon: 'email', module: 'communication' },
      { name: 'Webmail', href: '/dashboard/email/webmail', icon: 'email', module: 'communication' },
      { name: 'Team Chat', href: '/dashboard/chat', icon: 'chat', module: 'communication' },
    ],
  },
  {
    name: 'AI Features',
    icon: 'ai-cofounder',
    items: [
      { name: 'AI Co-founder', href: '/ai-cofounder', icon: 'ai-cofounder', module: 'ai-cofounder' },
      { name: 'AI Chat', href: '/ai-chat', icon: 'ai-chat', module: 'ai-chat' },
      { name: 'AI Insights', href: '/ai-insights', icon: 'ai-insights', module: 'ai-insights' },
      { name: 'Website Builder', href: '/website-builder', icon: 'website-builder', module: 'website-builder' },
      { name: 'Logo Generator', href: '/logo-generator', icon: 'logo-generator', module: 'logo-generator' },
      { name: 'Knowledge & RAG AI', href: '/knowledge-rag', icon: 'knowledge-rag', module: 'knowledge-rag' },
      { name: 'AI Calling Bot', href: '/voice-agents', icon: 'voice-agents', module: 'voice-agents', comingSoon: true },
    ],
  },
  {
    name: 'Productivity Suite',
    icon: 'documents',
    items: [
      { name: 'Spreadsheets', href: '/dashboard/spreadsheets', icon: 'spreadsheets', module: 'productivity' },
      { name: 'Documents', href: '/dashboard/docs', icon: 'documents', module: 'productivity' },
      { name: 'Slides', href: '/dashboard/slides', icon: 'slides', module: 'productivity' },
      { name: 'Drive', href: '/dashboard/drive', icon: 'drive', module: 'productivity' },
      { name: 'Meet', href: '/dashboard/meet', icon: 'meet', module: 'productivity' },
      { name: 'PDF Tools', href: '/dashboard/pdf', icon: 'pdf', module: 'productivity' },
    ],
  },
  {
    name: 'HR & Payroll',
    icon: 'employees',
    items: [
      { name: 'Employees', href: '/dashboard/hr/employees', icon: 'employees', module: 'hr' },
      { name: 'Attendance', href: '/dashboard/hr/attendance/calendar', icon: 'attendance', module: 'hr' },
      { name: 'Check-in/Check-out', href: '/dashboard/hr/attendance/check-in', icon: 'check-in', module: 'hr' },
      { name: 'Leave Management', href: '/dashboard/hr/leave/requests', icon: 'leave', module: 'hr' },
      { name: 'Leave Balances', href: '/dashboard/hr/leave/balances', icon: 'leave', module: 'hr' },
      { name: 'Apply Leave', href: '/dashboard/hr/leave/apply', icon: 'leave', module: 'hr' },
      { name: 'Hiring', href: '/dashboard/hr/hiring/job-requisitions', icon: 'hiring', module: 'hr' },
      { name: 'Candidates', href: '/dashboard/hr/hiring/candidates', icon: 'candidates', module: 'hr' },
      { name: 'Interviews', href: '/dashboard/hr/hiring/interviews', icon: 'interviews', module: 'hr' },
      { name: 'Offers', href: '/dashboard/hr/hiring/offers', icon: 'offers', module: 'hr' },
      { name: 'Onboarding', href: '/dashboard/hr/onboarding/instances', icon: 'onboarding', module: 'hr' },
      { name: 'Onboarding Templates', href: '/dashboard/hr/onboarding/templates', icon: 'onboarding', module: 'hr' },
      { name: 'Payroll', href: '/dashboard/hr/payroll/cycles', icon: 'payroll', module: 'hr' },
      { name: 'Salary Structures', href: '/dashboard/hr/payroll/salary-structures', icon: 'salary', module: 'hr' },
      { name: 'Payroll Reports', href: '/dashboard/hr/payroll/reports', icon: 'payroll', module: 'hr' },
      { name: 'Tax Declarations', href: '/dashboard/hr/tax-declarations', icon: 'tax', module: 'hr' },
    ],
  },
  {
    name: 'Reports & Analytics',
    icon: 'reports-analytics',
    items: [
      { name: 'Advanced Reporting', href: '/dashboard/reports', icon: 'reports-analytics', module: 'analytics' },
      { name: 'Custom Dashboards', href: '/dashboard/dashboards/custom', icon: 'custom-dashboards', module: 'analytics' },
      { name: 'Analytics', href: '/dashboard/analytics', icon: 'analytics', module: 'analytics' },
      { name: 'GST Reports', href: '/dashboard/gst/gstr-1', icon: 'gst', module: 'finance' },
      { name: 'GSTR-3B', href: '/dashboard/gst/gstr-3b', icon: 'gst', module: 'finance' },
      { name: 'GST Hub', href: '/dashboard/gst', icon: 'gst', module: 'finance' },
    ],
  },
  {
    name: 'Industries',
    icon: 'industries',
    items: [
      { name: 'Industries Hub', href: '/dashboard/industries', icon: 'industries', module: null },
      { name: 'Industry Setup', href: '/dashboard/setup/industry', icon: 'settings', module: null },
      { name: 'Business Units', href: '/dashboard/business-units', icon: 'vendors', module: null },
      // Existing Industries - using generic icons for now
      { name: 'Restaurant - Orders', href: '/dashboard/industries/restaurant/orders', icon: 'orders', module: null },
      { name: 'Restaurant - Menu', href: '/dashboard/industries/restaurant/menu', icon: 'documents', module: null },
      { name: 'Restaurant - Kitchen', href: '/dashboard/industries/restaurant/kitchen', icon: 'settings', module: null },
      { name: 'Restaurant - Tables', href: '/dashboard/industries/restaurant/tables', icon: 'settings', module: null },
      { name: 'Restaurant - Reservations', href: '/dashboard/industries/restaurant/reservations', icon: 'calendar', module: null },
      { name: 'Retail - Products', href: '/dashboard/industries/retail/products', icon: 'orders', module: null },
      // Phase 1: Critical Gaps
      { name: 'Healthcare - Prescriptions', href: '/dashboard/industries/healthcare/prescriptions', icon: 'documents', module: null },
      { name: 'Healthcare - Lab Tests', href: '/dashboard/industries/healthcare/lab-tests', icon: 'documents', module: null },
      { name: 'Education - Students', href: '/dashboard/industries/education/students', icon: 'contacts', module: null },
      { name: 'Education - Courses', href: '/dashboard/industries/education/courses', icon: 'documents', module: null },
      { name: 'Real Estate - Leads', href: '/dashboard/industries/real-estate/leads', icon: 'contacts', module: null },
      { name: 'Logistics - Shipments', href: '/dashboard/industries/logistics/shipments', icon: 'orders', module: null },
      // Phase 2: High Value
      { name: 'Agriculture - Crops', href: '/dashboard/industries/agriculture/crops', icon: 'documents', module: null },
      { name: 'Construction - Projects', href: '/dashboard/industries/construction/projects', icon: 'deals', module: null },
      { name: 'Beauty - Appointments', href: '/dashboard/industries/beauty/appointments', icon: 'calendar', module: null },
      { name: 'Automotive - Job Cards', href: '/dashboard/industries/automotive/job-cards', icon: 'documents', module: null },
      // Phase 3: Market Expansion
      { name: 'Hospitality - Bookings', href: '/dashboard/industries/hospitality/bookings', icon: 'calendar', module: null },
      { name: 'Legal - Cases', href: '/dashboard/industries/legal/cases', icon: 'documents', module: null },
      { name: 'Financial - Tax Filings', href: '/dashboard/industries/financial/tax-filings', icon: 'tax', module: null },
      { name: 'Events - Management', href: '/dashboard/industries/events/events', icon: 'events', module: null },
      { name: 'Wholesale - Customers', href: '/dashboard/industries/wholesale/customers', icon: 'contacts', module: null },
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
  // Get icon component from iconMap, fallback to Settings if not found
  const IconComponent = iconMap[item.icon] || Settings
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
      <IconComponent className="mr-3 h-6 w-6 text-gray-600 dark:text-gray-400 flex-shrink-0" strokeWidth={2} />
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
  // Get icon component for section header
  const SectionIcon = iconMap[section.icon] || Settings
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
          <SectionIcon className="mr-3 h-6 w-6 text-gray-600 dark:text-gray-400 shrink-0" strokeWidth={2} />
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
              item={{ name: 'Module Management', href: '/dashboard/admin/modules', icon: 'module-management', module: null }}
              isActive={isPathActive('/dashboard/admin/modules')}
              onLinkClick={onClose}
            />
          )}
          <NavItem
            item={{ name: 'Settings', href: '/dashboard/settings', icon: 'settings', module: null }}
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
              <Plus className="mr-2 h-4 w-4" strokeWidth={2} />
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
