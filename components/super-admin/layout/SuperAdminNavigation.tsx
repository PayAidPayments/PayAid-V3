'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Building2,
  IndianRupee,
  Settings,
  Shield,
  Server,
  Briefcase,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

interface NavGroup {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  subItems?: Array<{ label: string; href: string }>
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    href: '/super-admin',
    icon: LayoutDashboard,
    description: 'Platform control center',
  },
  {
    label: 'Business & Merchants',
    href: '/super-admin/business',
    icon: Building2,
    description: 'Everything about merchants, tenants, users, onboarding',
    subItems: [
      { label: 'Tenants & Merchants', href: '/super-admin/business/tenants' },
      { label: 'At-Risk Merchants', href: '/super-admin/business/merchants/at-risk' },
      { label: 'Platform Users', href: '/super-admin/business/users' },
      { label: 'Tenant Health', href: '/super-admin/business/tenant-health' },
      { label: 'Onboarding', href: '/super-admin/business/onboarding' },
      { label: 'Communication', href: '/super-admin/business/communication' },
    ],
  },
  {
    label: 'Revenue & Billing',
    href: '/super-admin/revenue',
    icon: IndianRupee,
    description: 'Money flowing through the platform and how you charge for it',
    subItems: [
      { label: 'Revenue & Payments', href: '/super-admin/revenue/payments' },
      { label: 'Billing', href: '/super-admin/revenue/billing' },
      { label: 'Plans & Modules', href: '/super-admin/revenue/plans' },
      { label: 'Merchant Analytics', href: '/super-admin/revenue/analytics' },
      { label: 'Reports & Exports', href: '/super-admin/revenue/reports' },
    ],
  },
  {
    label: 'Configuration',
    href: '/super-admin/configuration',
    icon: Settings,
    description: 'How the platform behaves: modules, flags, integrations',
    subItems: [
      { label: 'Feature Flags', href: '/super-admin/configuration/feature-flags' },
      { label: 'Platform Settings', href: '/super-admin/configuration/settings' },
      { label: 'Integrations & API', href: '/super-admin/configuration/integrations' },
      { label: 'API Key Oversight', href: '/super-admin/configuration/api-keys' },
      { label: 'Mobile & WhatsApp', href: '/super-admin/configuration/whatsapp' },
    ],
  },
  {
    label: 'Risk & Security',
    href: '/super-admin/risk-security',
    icon: Shield,
    description: 'Fraud, compliance, security controls',
    subItems: [
      { label: 'Risk Assessment', href: '/super-admin/risk-security/risk-assessment' },
      { label: 'Compliance', href: '/super-admin/risk-security/compliance' },
      { label: 'Security & Compliance', href: '/super-admin/risk-security/security' },
      { label: 'Audit Log', href: '/super-admin/risk-security/audit-log' },
    ],
  },
  {
    label: 'Operations',
    href: '/super-admin/operations',
    icon: Server,
    description: 'Health, infrastructure, jobs, AI, communications',
    subItems: [
      { label: 'Task Queue', href: '/super-admin/operations/tasks' },
      { label: 'System Health', href: '/super-admin/operations/system' },
      { label: 'Database & Backups', href: '/super-admin/operations/database' },
      { label: 'AI & Automations', href: '/super-admin/operations/ai' },
      { label: 'Communication', href: '/super-admin/operations/communication' },
    ],
  },
  {
    label: 'PayAid Payments',
    href: '/super-admin/payaid-payments',
    icon: Briefcase,
    description: 'Our own tenant data',
  },
]

export function SuperAdminNavigation() {
  const pathname = usePathname()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (href: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(href)) {
      newExpanded.delete(href)
    } else {
      newExpanded.add(href)
    }
    setExpandedGroups(newExpanded)
  }

  const isGroupActive = (group: NavGroup) => {
    if (group.href === '/super-admin') {
      return pathname === '/super-admin'
    }
    return pathname.startsWith(group.href)
  }

  const isSubItemActive = (subItem: { href: string }) => {
    return pathname === subItem.href || pathname.startsWith(subItem.href + '/')
  }

  // Auto-expand active groups
  const shouldExpand = (group: NavGroup) => {
    if (expandedGroups.has(group.href)) return true
    if (isGroupActive(group)) return true
    return group.subItems?.some((item) => isSubItemActive(item)) || false
  }

  return (
    <nav className="p-2 flex-1 space-y-0.5 overflow-y-auto">
      {navGroups.map((group) => {
        const isActive = isGroupActive(group)
        const isExpanded = shouldExpand(group)

        return (
          <div key={group.href}>
            <Link
              href={group.href}
              onClick={(e) => {
                if (group.subItems && group.subItems.length > 0) {
                  e.preventDefault()
                  toggleGroup(group.href)
                }
              }}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={group.description}
            >
              <group.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{group.label}</span>
              {group.subItems && group.subItems.length > 0 && (
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isExpanded && 'rotate-90'
                  )}
                />
              )}
            </Link>
            {isExpanded && group.subItems && (
              <div className="ml-4 mt-1 space-y-0.5">
                {group.subItems.map((subItem) => {
                  const isSubActive = isSubItemActive(subItem)
                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors',
                        isSubActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                      {subItem.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
