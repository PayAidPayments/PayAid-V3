'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useEffect, useState, useRef } from 'react';
import { Settings, LogOut, ChevronDown, Newspaper } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { Logo } from '@/components/brand/Logo';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [newsUnreadCount, setNewsUnreadCount] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { logout, tenant, user, token } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch news unread count
  useEffect(() => {
    const fetchNewsCount = async () => {
      try {
        if (!token) return;

        const response = await fetch('/api/news?limit=1', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setNewsUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        // Silently fail - news might not be available
      }
    };

    if (token) {
      fetchNewsCount();
      // Refresh every 5 minutes
      const interval = setInterval(fetchNewsCount, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleNewsClick = () => {
    // Toggle news sidebar
    const event = new CustomEvent('toggle-news-sidebar')
    window.dispatchEvent(event)
  }

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getProfileUrl = () => {
    if (tenant?.id) {
      return `/dashboard/${tenant.id}/settings/profile`;
    }
    return '/dashboard/settings/profile';
  };

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo href="/home" />

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {/* Notifications Bell */}
            {mounted && user && <NotificationBell />}
            
            {/* News Button */}
            {mounted && user && (
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
            {mounted && user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#53328A] to-[#F5C700] flex items-center justify-center text-white text-sm font-medium">
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                      {user.name || user.email || 'User'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          router.push(getProfileUrl());
                          setProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Profile Settings
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : mounted ? (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : (
              <div className="w-20 h-8" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

