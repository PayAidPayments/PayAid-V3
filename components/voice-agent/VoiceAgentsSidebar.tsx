'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Phone, Plus, History, BarChart3, Settings, FileText } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface VoiceAgentsSidebarProps {
  tenantId: string
}

export function VoiceAgentsSidebar({ tenantId }: VoiceAgentsSidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    {
      name: 'Agents',
      href: `/voice-agents/${tenantId}/Home`,
      icon: Phone,
    },
    {
      name: 'Create Agent',
      href: `/voice-agents/${tenantId}/New`,
      icon: Plus,
    },
    {
      name: 'Call History',
      href: `/voice-agents/${tenantId}/Calls`,
      icon: History,
    },
    {
      name: 'Analytics',
      href: `/voice-agents/${tenantId}/Analytics`,
      icon: BarChart3,
    },
    {
      name: 'Knowledge Base',
      href: `/voice-agents/${tenantId}/KnowledgeBase`,
      icon: FileText,
    },
    {
      name: 'Settings',
      href: `/voice-agents/${tenantId}/Settings`,
      icon: Settings,
    },
  ]

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Voice Agents
        </h2>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

