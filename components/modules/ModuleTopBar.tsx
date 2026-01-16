'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ModuleSwitcher } from './ModuleSwitcher'
import { cn } from '@/lib/utils/cn'
import { useAuthStore } from '@/lib/stores/auth'
import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Settings, LogOut, User, ChevronDown, Newspaper, MoreVertical } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface TopBarItem {
  name: string
  href: string
  icon?: string
}

interface ModuleTopBarProps {
  moduleId: string
  moduleName: string
  items: TopBarItem[]
  logo?: React.ReactNode
  maxVisibleItems?: number // Number of items to show before "More" menu
}

export function ModuleTopBar({ moduleId, moduleName, items, logo, maxVisibleItems = 5 }: ModuleTopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, tenant, user, token } = useAuthStore()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [newsUnreadCount, setNewsUnreadCount] = useState(0)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const moreMenuButtonRef = useRef<HTMLButtonElement>(null)

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === `/${moduleId}`) {
      return pathname === href || pathname === `/${moduleId}/home`
    }
    return pathname?.startsWith(href)
  }

  // Close profile menu when clicking outside (more menu uses backdrop)
  useEffect(() => {
    if (!profileMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false)
      }
    }

    // Use regular phase, not capture, to allow links to work
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileMenuOpen])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getProfileUrl = () => {
    if (tenant?.id) {
      return `/dashboard/${tenant.id}/settings/profile`
    }
    return '/dashboard/settings/profile'
  }

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
    // Toggle news sidebar
    const event = new CustomEvent('toggle-news-sidebar')
    window.dispatchEvent(event)
  }

  return (
    <nav className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-30">
      <div className="flex items-center h-full px-4 sm:px-6 gap-4">
        {/* Left: Logo and Module Name */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {logo || <span className="text-2xl">{getModuleIcon(moduleId)}</span>}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              {moduleName}
            </h2>
          </div>
        </div>

        {/* Center: Navigation Items */}
        <div className="hidden md:flex items-center gap-1 flex-1 min-w-0 overflow-x-auto overflow-y-visible scrollbar-hide">
          {/* Visible Items */}
          {items.slice(0, maxVisibleItems).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0',
                isActive(item.href)
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.name}
            </Link>
          ))}
          
          {/* More Menu (if there are more items) - Right after visible items */}
          {items.length > maxVisibleItems && (
            <div className="relative flex-shrink-0" ref={moreMenuRef}>
              <button
                ref={moreMenuButtonRef}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setMoreMenuOpen(prev => !prev)
                }}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1',
                  'focus:outline-none focus:ring-2 focus:ring-purple-500',
                  'cursor-pointer',
                  moreMenuOpen || items.slice(maxVisibleItems).some(item => isActive(item.href))
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
                aria-label="More menu"
                aria-expanded={moreMenuOpen}
                aria-haspopup="true"
                type="button"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {moreMenuOpen && typeof window !== 'undefined' && moreMenuButtonRef.current && createPortal(
                <>
                  {/* Backdrop to close on outside click */}
                  <div 
                    className="fixed inset-0 z-[199]"
                    onClick={(e) => {
                      // Only close if clicking directly on backdrop, not on dropdown
                      if (e.target === e.currentTarget) {
                        setMoreMenuOpen(false)
                      }
                    }}
                  />
                  {/* Dropdown Menu - Positioned using fixed positioning */}
                  {(() => {
                    const rect = moreMenuButtonRef.current!.getBoundingClientRect()
                    return (
                      <div 
                        data-more-menu-dropdown
                        className="fixed w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-[200]"
                        style={{
                          top: `${rect.bottom + 8}px`,
                          left: `${rect.left}px`,
                        }}
                        onClick={(e) => {
                          // Stop propagation to prevent backdrop from closing menu when clicking inside
                          e.stopPropagation()
                        }}
                      >
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          {items.slice(maxVisibleItems).map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => {
                                // Close menu - Next.js Link will handle navigation automatically
                                setMoreMenuOpen(false)
                              }}
                              className={cn(
                                'flex items-center px-4 py-2 text-sm transition-colors',
                                isActive(item.href)
                                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              )}
                              role="menuitem"
                            >
                              {item.icon && <span className="mr-3">{item.icon}</span>}
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </>,
                document.body
              )}
            </div>
          )}
        </div>

        {/* Right: Theme Toggle, Notifications, News, Module Switcher and Profile */}
        {/* These are always visible by default - cannot be hidden or changed */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Theme Toggle - Always Visible */}
          <ThemeToggle />
          
          {/* Notifications Bell - Always Visible */}
          <NotificationBell />
          
          {/* News Button - Only visible for Admin/Owner (based on access) */}
          {user && (user.role === 'admin' || user.role === 'owner') && (
            <button
              onClick={handleNewsClick}
              className="relative p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
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
          )}
          
          {/* Module Switcher - Always Visible */}
          <ModuleSwitcher />
          
          {/* Profile Dropdown - Always Visible */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#53328A] to-[#F5C700] flex items-center justify-center text-white font-semibold text-sm">
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
                      {user?.email || 'No email'}
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
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-700 px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                isActive(item.href)
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {item.icon && <span className="mr-1">{item.icon}</span>}
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

function getModuleIcon(moduleId: string): string {
  const icons: Record<string, string> = {
    crm: '👥',
    sales: '💼',
    finance: '💰',
    marketing: '📢',
    hr: '👔',
    projects: '📋',
    inventory: '📦',
    dashboard: '📊',
  }
  return icons[moduleId] || '📦'
}

