'use client'

/**
 * Phase 2: Module Navigation Component
 * Dynamic navigation based on enabled modules and user permissions
 */

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useModule } from '@/contexts/ModuleContext'
import { 
  Users, 
  UserCog, 
  DollarSign, 
  MessageSquare, 
  BarChart3, 
  CreditCard, 
  Workflow, 
  TrendingUp,
  ChevronRight 
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  UserCog,
  DollarSign,
  MessageSquare,
  BarChart3,
  CreditCard,
  Workflow,
  TrendingUp,
}

export function ModuleNavigation() {
  const { accessibleRoutes, currentModule } = useModule()
  const pathname = usePathname()

  if (accessibleRoutes.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No modules available. Contact your administrator.
      </div>
    )
  }

  return (
    <nav className="space-y-1">
      {accessibleRoutes.map(({ module, moduleName, moduleIcon, routes }) => {
        const IconComponent = iconMap[moduleIcon] || Users
        const isActive = currentModule === module
        const mainRoute = routes[0]

        return (
          <div key={module} className="space-y-1">
            {/* Module Header */}
            <Link
              href={mainRoute.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <IconComponent className="h-5 w-5" />
              <span className="flex-1">{moduleName}</span>
              {isActive && <ChevronRight className="h-4 w-4" />}
            </Link>

            {/* Module Sub-routes */}
            {isActive && routes.length > 1 && (
              <div className="ml-8 space-y-1 border-l pl-4">
                {routes.slice(1).map((route) => {
                  const isRouteActive = pathname === route.path || pathname.startsWith(route.path + '/')
                  return (
                    <Link
                      key={route.path}
                      href={route.path}
                      className={cn(
                        'block rounded-md px-3 py-2 text-sm transition-colors',
                        isRouteActive
                          ? 'bg-accent font-medium text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                      )}
                    >
                      {route.label}
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
