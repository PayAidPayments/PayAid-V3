'use client'

import { useAuthStore } from '@/lib/stores/auth'
import { NotificationBell } from '@/components/NotificationBell'

export function Header() {
  const { tenant } = useAuthStore()

  return (
    <header className="h-16 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between h-full px-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {tenant?.name || 'PayAid V3'}
          </h2>
          <p className="text-xs text-gray-500 capitalize">
            {tenant?.plan || 'Free'} Plan
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <NotificationBell />
        </div>
      </div>
    </header>
  )
}
