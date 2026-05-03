'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ModuleSwitcher } from '@/components/ModuleSwitcher'
import { cn } from '@/lib/utils/cn'
import { useAuthStore } from '@/lib/stores/auth'
import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Settings, LogOut, User, ChevronDown, Newspaper, MoreVertical, AlertTriangle, CreditCard } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { getTenantRouteKey } from '@/lib/utils/tenant-route-key'

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
  const queryClient = useQueryClient()
  const { logout, tenant, user, token } = useAuthStore()
  const tenantRouteKey = getTenantRouteKey(tenant)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [newsUnreadCount, setNewsUnreadCount] = useState(0)
  const [trialBillingStatus, setTrialBillingStatus] = useState<string>('active')
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [isTrialActive, setIsTrialActive] = useState<boolean>(false)
  const profileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const moreMenuButtonRef = useRef<HTMLButtonElement>(null)
  const warmedRouteDataRef = useRef<Record<string, boolean>>({})

  const isActive = (href: string) => {
    if (href === '/home' || href === `/${moduleId}`) {
      return pathname === href || pathname === `/${moduleId}/home` || pathname?.startsWith(`/${moduleId}/Home`)
    }
    return pathname?.startsWith(href)
  }

  // Close profile menu when clicking outside (more menu uses backdrop)
  useEffect(() => {
    if (!profileMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      const clickedProfileButton = profileMenuButtonRef.current?.contains(target) ?? false
      const clickedProfileDropdown =
        target instanceof Element && target.closest('[data-profile-menu-dropdown]') !== null

      if (!clickedProfileButton && !clickedProfileDropdown) {
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
    if (tenantRouteKey) return `/home/${tenantRouteKey}`
    return '/home'
  }

  // Fetch news unread count
  useEffect(() => {
    // Keep local dev responsive during QA by avoiding background unread polling.
    if (process.env.NODE_ENV !== 'production') return

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
    if (tenantRouteKey) {
      router.push(`/industry-intelligence/${tenantRouteKey}/Home`)
    } else {
      router.push('/industry-intelligence')
    }
  }

  useEffect(() => {
    if (!token || !tenant?.id) return

    const fetchTrialStatus = async () => {
      try {
        const response = await fetch('/api/billing/trial-status', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) return
        const payload = await response.json()
        setTrialBillingStatus(payload.billingStatus || 'active')
        setTrialDaysLeft(typeof payload.daysLeft === 'number' ? payload.daysLeft : null)
        setIsTrialActive(Boolean(payload.isTrialActive))
      } catch {
        // Non-blocking signal only.
      }
    }

    fetchTrialStatus()
    const id = window.setInterval(fetchTrialStatus, 60_000)
    return () => window.clearInterval(id)
  }, [token, tenant?.id])

  useEffect(() => {
    if (trialBillingStatus !== 'payment_required' || !tenantRouteKey) return
    const billingPath = `/finance/${tenantRouteKey}/Billing`
    const isAllowedPath =
      pathname?.startsWith(billingPath) ||
      pathname?.startsWith('/dashboard/billing') ||
      pathname?.startsWith('/checkout') ||
      pathname?.startsWith('/settings')
    if (!isAllowedPath) {
      router.replace(billingPath)
    }
  }, [trialBillingStatus, tenantRouteKey, pathname, router])

  const showTrialBanner =
    trialBillingStatus === 'payment_required' ||
    (trialBillingStatus === 'trialing' && isTrialActive && typeof trialDaysLeft === 'number' && trialDaysLeft <= 5)

  const warmCrmRouteData = (href: string) => {
    if (!token) return
    const m = href.match(/^\/crm\/([^/]+)\/(Leads|Contacts|Deals)\/?$/)
    const tenantIdFromHref = m?.[1]
    const entity = m?.[2]
    if (!tenantIdFromHref) return
    const warmKey = `${tenantIdFromHref}:${entity}`
    if (warmedRouteDataRef.current[warmKey]) return
    warmedRouteDataRef.current[warmKey] = true

    if (entity === 'Leads') {
      const params = { page: 1, limit: 25, search: '', stage: 'prospect', tenantId: tenantIdFromHref }
      const qs = new URLSearchParams()
      qs.set('page', '1')
      qs.set('limit', '25')
      qs.set('stage', 'prospect')
      qs.set('tenantId', tenantIdFromHref)
      const url = `/api/contacts?${qs.toString()}`
      queryClient
        .prefetchQuery({
          queryKey: ['contacts', params],
          queryFn: async () => {
            const res = await fetch(url, { headers: getAuthHeaders() })
            if (!res.ok) throw new Error('Failed to warm leads')
            return res.json()
          },
          staleTime: 15_000,
        })
        .catch(() => {})
      return
    }

    if (entity === 'Contacts') {
      const params = { page: 1, limit: 25, search: '', tenantId: tenantIdFromHref }
      const qs = new URLSearchParams()
      qs.set('page', '1')
      qs.set('limit', '25')
      qs.set('tenantId', tenantIdFromHref)
      const url = `/api/contacts?${qs.toString()}`
      queryClient
        .prefetchQuery({
          queryKey: ['contacts', params],
          queryFn: async () => {
            const res = await fetch(url, { headers: getAuthHeaders() })
            if (!res.ok) throw new Error('Failed to warm contacts')
            return res.json()
          },
          staleTime: 15_000,
        })
        .catch(() => {})
      return
    }

    if (entity === 'Deals') {
      const params = { page: 1, limit: 50, tenantId: tenantIdFromHref }
      const qs = new URLSearchParams()
      qs.set('page', '1')
      qs.set('limit', '50')
      qs.set('tenantId', tenantIdFromHref)
      const url = `/api/deals?${qs.toString()}`
      queryClient
        .prefetchQuery({
          queryKey: ['deals', params],
          queryFn: async () => {
            const res = await fetch(url, { headers: getAuthHeaders() })
            if (!res.ok) throw new Error('Failed to warm deals')
            return res.json()
          },
          staleTime: 15_000,
        })
        .catch(() => {})
    }
  }

  return (
    <header className="w-screen h-14 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-950/90 dark:to-slate-900/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="w-full h-full flex items-center px-4 sm:px-6 lg:px-12 xl:px-20 gap-4">
        {/* Left: Module name only (ModuleSwitcher is on the right) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {moduleName}
          </span>
        </div>

        {/* Center: Navigation Items */}
        <div className="hidden md:flex items-center gap-1 flex-1 min-w-0 overflow-x-auto overflow-y-visible scrollbar-hide">
          {/* Visible Items */}
          {items.slice(0, maxVisibleItems).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => warmCrmRouteData(item.href)}
              onFocus={() => warmCrmRouteData(item.href)}
              onPointerDown={() => warmCrmRouteData(item.href)}
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
                              onMouseEnter={() => warmCrmRouteData(item.href)}
                              onFocus={() => warmCrmRouteData(item.href)}
                              onPointerDown={() => warmCrmRouteData(item.href)}
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

        {/* Right: Global Search, Theme Toggle, Notifications, Module Switcher, News, Profile */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <GlobalSearch />
          <ThemeToggle />
          <NotificationBell />
          <ModuleSwitcher />
          
          {user && (user.role === 'admin' || user.role === 'owner') && (
            <button
              onClick={handleNewsClick}
              className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Open Industry Intelligence"
              title="Industry Intelligence"
            >
              <Newspaper className="w-4 h-4" />
              {newsUnreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-semibold">
                  {newsUnreadCount > 9 ? '9+' : newsUnreadCount}
                </span>
              )}
            </button>
          )}
          <div className="relative">
            <button
              ref={profileMenuButtonRef}
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#53328A] to-[#F5C700] flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileMenuOpen && typeof window !== 'undefined' && profileMenuButtonRef.current && createPortal(
              <>
                <div
                  className="fixed inset-0 z-[209]"
                  onClick={() => setProfileMenuOpen(false)}
                  aria-hidden="true"
                />
                {(() => {
                  const rect = profileMenuButtonRef.current!.getBoundingClientRect()
                  const menuWidth = 224
                  const left = Math.max(16, rect.right - menuWidth)
                  return (
                    <div
                      data-profile-menu-dropdown
                      className="fixed w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-[210]"
                      style={{
                        top: `${rect.bottom + 8}px`,
                        left: `${left}px`,
                      }}
                    >
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
                  )
                })()}
              </>,
              document.body
            )}
          </div>
        </div>
      </div>

      {showTrialBanner && (
        <div
          className={cn(
            'border-t px-4 sm:px-6 lg:px-12 xl:px-20 py-2 text-xs sm:text-sm',
            trialBillingStatus === 'payment_required'
              ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
              : 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {trialBillingStatus === 'payment_required' ? (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              ) : (
                <CreditCard className="h-4 w-4 shrink-0" />
              )}
              <span>
                {trialBillingStatus === 'payment_required'
                  ? 'Your trial has ended. Upgrade now to continue using PayAid modules.'
                  : `Your trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'}. Complete billing to avoid interruption.`}
              </span>
            </div>
            {tenantRouteKey && (
              <Link
                href={`/finance/${tenantRouteKey}/Billing`}
                className="font-semibold underline underline-offset-2 whitespace-nowrap"
              >
                Upgrade now
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Mobile / Tablet: single "Menu" dropdown instead of horizontal scroll */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setMobileMenuOpen((prev) => !prev)
            }}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            <MoreVertical className="w-5 h-5" />
            Menu
          </button>
          {mobileMenuOpen && typeof window !== 'undefined' && createPortal(
            <>
              <div
                className="fixed inset-0 z-[199]"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />
              <div
                className="fixed left-4 right-4 top-[calc(3.5rem+8px)] z-[200] max-h-[70vh] overflow-y-auto rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 py-1"
                role="menu"
              >
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center px-4 py-3 text-sm transition-colors',
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
            </>,
            document.body
          )}
        </div>
      </div>
      {/* end of header - do not use </nav>, must match opening <header> */}
    </header>
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

