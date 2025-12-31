'use client'

import { useAuthStore } from '@/lib/stores/auth'
import { NotificationBell } from '@/components/NotificationBell'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Newspaper, User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { tenant, token, user, logout } = useAuthStore()
  const [newsUnreadCount, setNewsUnreadCount] = useState(0)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileMenuOpen])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const getProfileUrl = () => {
    if (tenant?.id) {
      return `/dashboard/${tenant.id}/settings/profile`
    }
    return '/dashboard/settings/profile'
  }

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-30 transition-colors">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Menu Toggle Button - Mobile and Desktop */}
          <button
            onClick={onMenuClick}
            className="mobile-menu-button desktop-menu-button p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[200px] sm:max-w-none">
              {tenant?.name || 'PayAid V3'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {tenant?.plan || 'Free'} Plan
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle />
          {/* News Button */}
          <button
            onClick={handleNewsClick}
            className="relative p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
          
          {/* Profile Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-50">
                <div className="py-1" role="menu">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <Link
                    href={getProfileUrl()}
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    role="menuitem"
                  >
                    <User className="w-4 h-4 mr-3" />
                    Profile Settings
                  </Link>
                  <Link
                    href={getProfileUrl()}
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    role="menuitem"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </Link>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
