'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Users, Briefcase, CheckSquare } from 'lucide-react'

interface EmptyStateProps {
  type: 'contacts' | 'deals' | 'tasks' | 'invoices' | 'generic'
  title?: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  icon?: React.ReactNode
}

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
}: EmptyStateProps) {
  const getDefaultConfig = () => {
    switch (type) {
      case 'contacts':
        return {
          title: 'No contacts yet',
          description: 'Start building your contact database by adding your first contact.',
          actionLabel: 'Add Contact',
          actionHref: '/crm/[tenantId]/contacts-new',
          icon: <Users className="w-16 h-16 text-gray-300" />,
        }
      case 'deals':
        return {
          title: 'No deals in pipeline',
          description: 'Create your first deal to start tracking sales opportunities.',
          actionLabel: 'Create Deal',
          actionHref: '/crm/[tenantId]/Deals/New',
          icon: <Briefcase className="w-16 h-16 text-gray-300" />,
        }
      case 'tasks':
        return {
          title: 'No tasks found',
          description: 'Create tasks to stay organized and never miss a follow-up.',
          actionLabel: 'Create Task',
          actionHref: '/crm/[tenantId]/Tasks',
          icon: <CheckSquare className="w-16 h-16 text-gray-300" />,
        }
      case 'invoices':
        return {
          title: 'No invoices yet',
          description: 'Create your first invoice to start tracking revenue.',
          actionLabel: 'Create Invoice',
          actionHref: '/finance/[tenantId]/Invoices/new',
          icon: <FileText className="w-16 h-16 text-gray-300" />,
        }
      default:
        return {
          title: title || 'No data available',
          description: description || 'Get started by adding your first item.',
          actionLabel: actionLabel || 'Get Started',
          icon: icon || <Plus className="w-16 h-16 text-gray-300" />,
        }
    }
  }

  const config = getDefaultConfig()

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 text-gray-400">
        {icon || config.icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title || config.title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        {description || config.description}
      </p>
      {(actionHref || onAction) && (
        actionHref ? (
          <Link href={actionHref}>
            <Button
              onClick={onAction}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {actionLabel || config.actionLabel}
            </Button>
          </Link>
        ) : (
          <Button
            onClick={onAction}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {actionLabel || config.actionLabel}
          </Button>
        )
      )}
    </div>
  )
}
