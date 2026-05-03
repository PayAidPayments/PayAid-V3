'use client'

import { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface Tab {
  id: string
  label: string
  href: string
  badge?: number | string
}

interface TabbedPageProps {
  title: string
  description?: string
  tabs: Tab[]
  children: ReactNode
  defaultTab?: string
}

export function TabbedPage({ title, description, tabs, children, defaultTab }: TabbedPageProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Find active tab based on current pathname
  const activeTab = tabs.find((tab) => pathname === tab.href || pathname.startsWith(tab.href + '/')) || tabs[0]

  const handleTabClick = (tab: Tab) => {
    router.push(tab.href)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab.id === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                )}
              >
                {tab.label}
                {tab.badge && (
                  <span
                    className={cn(
                      'ml-2 py-0.5 px-2 rounded-full text-xs',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  )
}
