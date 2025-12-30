'use client'

import { useAuthStore } from '@/lib/stores/auth'
import { NotificationBell } from '@/components/NotificationBell'

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { tenant } = useAuthStore()

  return (
    <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-30">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Menu Toggle Button - Mobile and Desktop */}
          <button
            onClick={onMenuClick}
            className="mobile-menu-button desktop-menu-button p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-none">
              {tenant?.name || 'PayAid V3'}
            </h2>
            <p className="text-xs text-gray-500 capitalize">
              {tenant?.plan || 'Free'} Plan
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <NotificationBell />
        </div>
      </div>
    </header>
  )
}
