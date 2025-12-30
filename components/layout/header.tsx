'use client'

import { useAuthStore } from '@/lib/stores/auth'
import { NotificationBell } from '@/components/NotificationBell'
import { Newspaper } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { tenant, token } = useAuthStore()
  const [newsUnreadCount, setNewsUnreadCount] = useState(0)

  // Fetch news unread count
  useEffect(() => {
    const fetchNewsCount = async () => {
      try {
        if (!token) return

        const response = await fetch('/api/news?limit=1', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setNewsUnreadCount(data.unreadCount || 0)
        }
      } catch (error) {
        // Silently fail - news might not be available
      }
    }

    if (token) {
      fetchNewsCount()
      // Refresh every 5 minutes
      const interval = setInterval(fetchNewsCount, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [token])

  const handleNewsClick = () => {
    // Trigger news sidebar to open
    const event = new CustomEvent('openNewsSidebar')
    window.dispatchEvent(event)
    
    // Also try to update localStorage to ensure sidebar opens
    if (typeof window !== 'undefined') {
      localStorage.setItem('newsSidebarCollapsed', 'false')
      // Force a re-render by updating a state that NewsSidebar listens to
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'newsSidebarCollapsed',
        newValue: 'false',
      }))
    }
  }

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
          {/* News Button */}
          <button
            onClick={handleNewsClick}
            className="relative p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Open Industry Intelligence"
            title="Industry Intelligence"
          >
            <Newspaper className="w-5 h-5" />
            {newsUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                {newsUnreadCount > 9 ? '9+' : newsUnreadCount}
              </span>
            )}
          </button>
          <NotificationBell />
        </div>
      </div>
    </header>
  )
}
