'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, LogOut, MoreVertical, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useAuthStore } from '@/lib/stores/auth'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { VoiceModuleSwitcher } from '@/components/voice-agent/VoiceModuleSwitcher'

export type VoiceTopBarItem = {
  name: string
  href: string
  icon?: string
}

type VoiceTopBarProps = {
  moduleName: string
  items: VoiceTopBarItem[]
  maxVisibleItems?: number
}

/**
 * Voice-only top bar — avoids ModuleTopBar (react-query prefetch, trial polling, module switcher graph).
 */
export function VoiceTopBar({ moduleName, items, maxVisibleItems = 6 }: VoiceTopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, tenant, user } = useAuthStore()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const profileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const moreMenuButtonRef = useRef<HTMLButtonElement>(null)

  const isActive = (href: string) => pathname?.startsWith(href)

  useEffect(() => {
    if (!profileMenuOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedProfileButton = profileMenuButtonRef.current?.contains(target) ?? false
      const clickedProfileDropdown =
        target instanceof Element && target.closest('[data-voice-profile-menu]') !== null
      if (!clickedProfileButton && !clickedProfileDropdown) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileMenuOpen])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const profileUrl = tenant?.id ? `/home/${tenant.id}` : '/home'

  return (
    <header className="w-screen h-14 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-950/90 dark:to-slate-900/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="w-full h-full flex items-center px-4 sm:px-6 lg:px-12 xl:px-20 gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {moduleName}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
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
          {items.length > maxVisibleItems && (
            <div className="relative flex-shrink-0" ref={moreMenuRef}>
              <button
                ref={moreMenuButtonRef}
                type="button"
                onClick={() => setMoreMenuOpen((prev) => !prev)}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1',
                  moreMenuOpen || items.slice(maxVisibleItems).some((item) => isActive(item.href))
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
                aria-expanded={moreMenuOpen}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {moreMenuOpen &&
                typeof window !== 'undefined' &&
                moreMenuButtonRef.current &&
                createPortal(
                  <>
                    <div className="fixed inset-0 z-[199]" onClick={() => setMoreMenuOpen(false)} />
                    <div
                      className="fixed w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-[200] py-1"
                      style={{
                        top: moreMenuButtonRef.current.getBoundingClientRect().bottom + 8,
                        left: moreMenuButtonRef.current.getBoundingClientRect().left,
                      }}
                    >
                      {items.slice(maxVisibleItems).map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreMenuOpen(false)}
                          className={cn(
                            'flex items-center px-4 py-2 text-sm transition-colors',
                            isActive(item.href)
                              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          )}
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
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <ThemeToggle />
          <VoiceModuleSwitcher />
          <div className="relative">
            <button
              ref={profileMenuButtonRef}
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#53328A] to-[#F5C700] flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <ChevronDown
                className={cn('w-4 h-4 transition-transform', profileMenuOpen && 'rotate-180')}
              />
            </button>
            {profileMenuOpen &&
              typeof window !== 'undefined' &&
              profileMenuButtonRef.current &&
              createPortal(
                <>
                  <div className="fixed inset-0 z-[209]" onClick={() => setProfileMenuOpen(false)} />
                  <div
                    data-voice-profile-menu
                    className="fixed w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-[210] py-1"
                    style={{
                      top: profileMenuButtonRef.current.getBoundingClientRect().bottom + 8,
                      left: Math.max(
                        16,
                        profileMenuButtonRef.current.getBoundingClientRect().right - 224
                      ),
                    }}
                  >
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.email || 'No email'}
                      </p>
                    </div>
                    <Link
                      href={profileUrl}
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <User className="w-4 h-4 mr-3" />
                      Profile Settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </>,
                document.body
              )}
          </div>
        </div>
      </div>

      <div className="md:hidden border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-expanded={mobileMenuOpen}
          >
            <MoreVertical className="w-5 h-5" />
            Menu
          </button>
          {mobileMenuOpen &&
            typeof window !== 'undefined' &&
            createPortal(
              <>
                <div className="fixed inset-0 z-[199]" onClick={() => setMobileMenuOpen(false)} />
                <div className="fixed left-4 right-4 top-[calc(3.5rem+8px)] z-[200] max-h-[70vh] overflow-y-auto rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 py-1">
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
    </header>
  )
}
