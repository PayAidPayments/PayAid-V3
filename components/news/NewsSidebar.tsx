'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, ChevronLeft, ChevronRight, ExternalLink, Filter } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useAuthStore } from '@/lib/stores/auth'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

interface NewsItem {
  id: string
  title: string
  summary?: string
  description?: string
  urgency: string
  icon?: string
  category: string
  source: string
  sourceUrl?: string
  sourceName?: string
  businessImpact?: any
  recommendedActions?: any[]
  isRead: boolean
  createdAt: string
}

interface NewsResponse {
  newsItems: NewsItem[]
  grouped: {
    critical: NewsItem[]
    important: NewsItem[]
    informational: NewsItem[]
    opportunity: NewsItem[]
    warning: NewsItem[]
    growth: NewsItem[]
  }
  unreadCount: number
  total: number
}

const URGENCY_CONFIG = {
  critical: {
    label: 'CRITICAL',
    color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    icon: '🔴',
    badgeColor: 'bg-red-500',
  },
  important: {
    label: 'IMPORTANT',
    color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
    icon: '🟡',
    badgeColor: 'bg-yellow-500',
  },
  informational: {
    label: 'INFORMATIONAL',
    color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    icon: '🟢',
    badgeColor: 'bg-blue-500',
  },
  opportunity: {
    label: 'OPPORTUNITY',
    color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300',
    icon: '💡',
    badgeColor: 'bg-purple-500',
  },
  warning: {
    label: 'WARNING',
    color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300',
    icon: '⚠️',
    badgeColor: 'bg-orange-500',
  },
  growth: {
    label: 'GROWTH',
    color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
    icon: '📈',
    badgeColor: 'bg-green-500',
  },
}

const CATEGORY_CONFIG = {
  'government-alerts': {
    label: 'Government Alerts',
    icon: '🏛️',
    color: 'bg-blue-100 text-blue-800',
  },
  'competitor-tracking': {
    label: 'Competitor Intelligence',
    icon: '🔍',
    color: 'bg-purple-100 text-purple-800',
  },
  'market-trends': {
    label: 'Market Trends',
    icon: '📈',
    color: 'bg-green-100 text-green-800',
  },
  'supplier-intelligence': {
    label: 'Supplier Intelligence',
    icon: '🚚',
    color: 'bg-orange-100 text-orange-800',
  },
  'technology-trends': {
    label: 'Technology & Trends',
    icon: '💻',
    color: 'bg-indigo-100 text-indigo-800',
  },
}

export function NewsSidebar() {
  // Load saved preference from localStorage, default to closed (collapsed)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return true // Default to collapsed for SSR
    const saved = localStorage.getItem('newsSidebarCollapsed')
    return saved !== null ? saved === 'true' : true // Default to collapsed (closed)
  })
  
  const [isOpen, setIsOpen] = useState(false) // Always start closed, user must open it
  const [isMounted, setIsMounted] = useState(false) // Track if component is mounted
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const queryClient = useQueryClient()
  const sidebarRef = useRef<HTMLDivElement>(null) // Ref for the sidebar container
  
  // Handle responsive behavior for mobile/tablet
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768
  })
  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window === 'undefined') return false
    const width = window.innerWidth
    return width >= 768 && width < 1024
  })
  
  // Persist collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('newsSidebarCollapsed', String(isCollapsed))
    }
  }, [isCollapsed])

  // Listen for custom event from Header button
  useEffect(() => {
    const handleOpenNewsSidebar = () => {
      setIsCollapsed(false)
      setIsOpen(true)
    }

    window.addEventListener('openNewsSidebar', handleOpenNewsSidebar)
    return () => {
      window.removeEventListener('openNewsSidebar', handleOpenNewsSidebar)
    }
  }, [])

  // Listen for storage events (when localStorage changes from other tabs/components)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'newsSidebarCollapsed') {
        const shouldCollapse = e.newValue === 'true'
        if (!shouldCollapse && isCollapsed) {
          setIsCollapsed(false)
          setIsOpen(true)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [isCollapsed])

  // Set mounted state
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Handle responsive behavior for mobile/tablet
  useEffect(() => {
    const checkScreenSize = () => {
      if (typeof window === 'undefined') return
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    const handleOrientationChange = () => {
      setTimeout(checkScreenSize, 200) // Delay to allow browser to update dimensions
    }
    window.addEventListener('orientationchange', handleOrientationChange)
    
    return () => {
      window.removeEventListener('resize', checkScreenSize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  // Handle click outside to close sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close if sidebar is open and not collapsed
      if (!isOpen || isCollapsed || !sidebarRef.current) {
        return
      }

      const target = event.target as Node
      
      // Check if click is outside the sidebar
      if (!sidebarRef.current.contains(target)) {
        // Also check if click is not on the collapsed button
        const collapsedButton = document.querySelector('[aria-label="Open Industry Intelligence sidebar"]')
        if (!collapsedButton || !collapsedButton.contains(target)) {
          // Prevent event propagation and close sidebar
          event.stopPropagation()
          setIsOpen(false)
          setIsCollapsed(true)
        }
      }
    }

    // Add event listener when sidebar is open
    if (isOpen && !isCollapsed) {
      // Use capture phase to catch clicks earlier
      document.addEventListener('mousedown', handleClickOutside, true)
      // Also listen for clicks on the document
      document.addEventListener('click', handleClickOutside, true)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [isOpen, isCollapsed])
  
  // News sidebar is now an overlay - no need to modify main content classes
  // Removed CSS class manipulation since news sidebar doesn't affect main content layout

  const { token, tenant } = useAuthStore()

  // Sample news data for demo business (hardcoded, separate from API)
  const getSampleNewsForDemo = (): NewsResponse => {
    const sampleNews: NewsItem[] = [
      {
        id: 'demo-1',
        title: 'New Government Tax Incentive Program Launched',
        summary: 'Government announces new tax incentives for small and medium businesses in the technology sector.',
        description: 'The government has launched a new tax incentive program specifically designed for technology companies. This program offers up to 30% tax reduction for qualifying businesses.',
        urgency: 'opportunity',
        icon: '🏛️',
        category: 'government-alerts',
        source: 'Government Portal',
        sourceName: 'Ministry of Finance',
        businessImpact: {
          impact: 'This could reduce your annual tax burden by up to ₹2,00,000 if you qualify. Consider reviewing eligibility criteria immediately.',
        },
        recommendedActions: [
          { action: 'Review eligibility criteria on the government portal' },
          { action: 'Consult with your tax advisor about application process' },
          { action: 'Prepare necessary documentation for application' },
        ],
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'demo-2',
        title: 'Major Competitor Launches New Product Line',
        summary: 'TechCorp Inc. announces expansion into your market segment with competitive pricing.',
        description: 'TechCorp Inc., a major competitor, has launched a new product line that directly competes with your offerings. They are offering aggressive pricing and extended warranties.',
        urgency: 'important',
        icon: '🔍',
        category: 'competitor-tracking',
        source: 'Industry News',
        sourceName: 'Business Weekly',
        businessImpact: {
          impact: 'This competitive move may impact your market share. Monitor customer feedback and consider strategic pricing adjustments.',
        },
        recommendedActions: [
          { action: 'Analyze competitor pricing and features' },
          { action: 'Review your value proposition and differentiators' },
          { action: 'Consider customer retention strategies' },
        ],
        isRead: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'demo-3',
        title: 'Market Trends: Digital Transformation Accelerating',
        summary: 'Industry report shows 45% increase in digital transformation investments.',
        description: 'A recent industry report indicates that businesses are accelerating their digital transformation initiatives, with a 45% year-over-year increase in investments.',
        urgency: 'growth',
        icon: '📈',
        category: 'market-trends',
        source: 'Industry Report',
        sourceName: 'Tech Research Institute',
        businessImpact: {
          impact: 'This trend presents opportunities for growth. Consider expanding your digital service offerings to capture market demand.',
        },
        recommendedActions: [
          { action: 'Evaluate your digital service portfolio' },
          { action: 'Identify growth opportunities in digital services' },
          { action: 'Develop a digital transformation roadmap' },
        ],
        isRead: false,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 'demo-4',
        title: 'Key Supplier Announces Price Increase',
        summary: 'Primary supplier notifies 8% price increase effective next quarter.',
        description: 'Your primary supplier has notified you of an 8% price increase that will take effect in the next quarter. This may impact your profit margins.',
        urgency: 'warning',
        icon: '🚚',
        category: 'supplier-intelligence',
        source: 'Supplier Notification',
        sourceName: 'Supply Chain Alert',
        businessImpact: {
          impact: 'This price increase could reduce your profit margins by approximately 3-5%. Consider negotiating or exploring alternative suppliers.',
        },
        recommendedActions: [
          { action: 'Negotiate with current supplier for better terms' },
          { action: 'Research alternative suppliers and compare pricing' },
          { action: 'Review your pricing strategy to maintain margins' },
        ],
        isRead: false,
        createdAt: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: 'demo-5',
        title: 'New AI Technology Trends in Business Automation',
        summary: 'Latest AI tools can automate up to 60% of routine business processes.',
        description: 'Recent developments in AI technology have made it possible to automate a significant portion of routine business processes, potentially reducing operational costs.',
        urgency: 'informational',
        icon: '💻',
        category: 'technology-trends',
        source: 'Tech News',
        sourceName: 'Tech Innovation Daily',
        businessImpact: {
          impact: 'Adopting AI automation could reduce operational costs by 20-30% while improving efficiency.',
        },
        recommendedActions: [
          { action: 'Research AI automation tools relevant to your business' },
          { action: 'Identify processes that could benefit from automation' },
          { action: 'Consider pilot programs for AI implementation' },
        ],
        isRead: false,
        createdAt: new Date(Date.now() - 345600000).toISOString(),
      },
    ]

    // Filter by category if selected
    const filteredNews = selectedCategory
      ? sampleNews.filter(item => item.category === selectedCategory)
      : sampleNews

    // Group by urgency
    const grouped = {
      critical: filteredNews.filter(item => item.urgency === 'critical'),
      important: filteredNews.filter(item => item.urgency === 'important'),
      informational: filteredNews.filter(item => item.urgency === 'informational'),
      opportunity: filteredNews.filter(item => item.urgency === 'opportunity'),
      warning: filteredNews.filter(item => item.urgency === 'warning'),
      growth: filteredNews.filter(item => item.urgency === 'growth'),
    }

    return {
      newsItems: filteredNews,
      grouped,
      unreadCount: filteredNews.filter(item => !item.isRead).length,
      total: filteredNews.length,
    }
  }

  // Check if this is demo business
  const isDemoBusiness = tenant?.subdomain === 'demo' || tenant?.name === 'Demo Business Pvt Ltd'

  // Fetch news items with category filter
  const { data, isLoading, error: fetchError } = useQuery<NewsResponse>({
    queryKey: ['news', token, selectedCategory],
    queryFn: async () => {
      const url = new URL('/api/news', window.location.origin)
      url.searchParams.set('limit', '50')
      if (selectedCategory) {
        url.searchParams.set('category', selectedCategory)
      }
      
      const response = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch news')
      }
      const apiData = await response.json()
      
      // If API returns no data and this is demo business, use sample news
      if (isDemoBusiness && apiData.total === 0) {
        return getSampleNewsForDemo()
      }
      
      return apiData
    },
    enabled: !!token,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2, // Retry twice on failure
    retryDelay: 1000, // Wait 1 second between retries
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/news/${id}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to mark as read')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] })
    },
  })

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/news/${id}/dismiss`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to dismiss')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] })
    },
  })

  const handleMarkAsRead = (id: string) => {
    // For sample news (demo business), just update local state
    if (id.startsWith('demo-')) {
      // Update the sample news item to mark as read
      // This is a local-only operation for demo purposes
      queryClient.setQueryData<NewsResponse>(['news', token, selectedCategory], (oldData) => {
        if (!oldData) return oldData
        const updatedItems = oldData.newsItems.map(item => 
          item.id === id ? { ...item, isRead: true } : item
        )
        // Recalculate grouped and unreadCount
        const grouped = {
          critical: updatedItems.filter(item => item.urgency === 'critical'),
          important: updatedItems.filter(item => item.urgency === 'important'),
          informational: updatedItems.filter(item => item.urgency === 'informational'),
          opportunity: updatedItems.filter(item => item.urgency === 'opportunity'),
          warning: updatedItems.filter(item => item.urgency === 'warning'),
          growth: updatedItems.filter(item => item.urgency === 'growth'),
        }
        return {
          ...oldData,
          newsItems: updatedItems,
          grouped,
          unreadCount: updatedItems.filter(item => !item.isRead).length,
        }
      })
    } else {
      markAsReadMutation.mutate(id)
    }
  }

  const handleDismiss = (id: string) => {
    // For sample news (demo business), just update local state
    if (id.startsWith('demo-')) {
      // Remove the item from the list
      queryClient.setQueryData<NewsResponse>(['news', token, selectedCategory], (oldData) => {
        if (!oldData) return oldData
        const updatedItems = oldData.newsItems.filter(item => item.id !== id)
        // Recalculate grouped and unreadCount
        const grouped = {
          critical: updatedItems.filter(item => item.urgency === 'critical'),
          important: updatedItems.filter(item => item.urgency === 'important'),
          informational: updatedItems.filter(item => item.urgency === 'informational'),
          opportunity: updatedItems.filter(item => item.urgency === 'opportunity'),
          warning: updatedItems.filter(item => item.urgency === 'warning'),
          growth: updatedItems.filter(item => item.urgency === 'growth'),
        }
        return {
          ...oldData,
          newsItems: updatedItems,
          grouped,
          unreadCount: updatedItems.filter(item => !item.isRead).length,
          total: updatedItems.length,
        }
      })
    } else {
      dismissMutation.mutate(id)
    }
  }

  // Use sample news for demo business if API returns no data
  const finalData = isDemoBusiness && (!data || data.total === 0) 
    ? getSampleNewsForDemo() 
    : data

  const grouped = finalData?.grouped || {
    critical: [],
    important: [],
    informational: [],
    opportunity: [],
    warning: [],
    growth: [],
  }

  const unreadCount = finalData?.unreadCount || 0

  // Always render the collapsed button when collapsed
  if (isCollapsed) {
    return (
      <div 
        className="fixed right-0 top-1/2 -translate-y-1/2 pointer-events-auto"
        style={{ 
          zIndex: 10000,
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <button
          onClick={() => {
            setIsCollapsed(false)
            setIsOpen(true)
          }}
          className="bg-[#53328A] text-white p-2 sm:p-3 rounded-l-lg shadow-2xl hover:bg-[#6B42A3] active:bg-[#5A2A7A] transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center border-2 border-white"
          aria-label="Open Industry Intelligence sidebar"
          title="Industry Intelligence"
          style={{ 
            zIndex: 10000,
            position: 'relative',
          }}
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold z-10">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Overlay when news sidebar is open - Show on all devices for better UX */}
      {isOpen && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => {
            setIsOpen(false)
            setIsCollapsed(true)
          }}
          style={{ pointerEvents: 'auto' }}
        />
      )}
      <div
        ref={sidebarRef}
        className={cn(
          'fixed right-0 top-0 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 flex flex-col transition-transform duration-300',
          // Responsive width: full width on mobile, 320px on tablet, 320px on desktop
          isMobile ? 'w-full sm:w-80' : 'w-80',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📰</span>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Industry Intelligence</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors",
                selectedCategory && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              )}
              aria-label="Filter news"
              title="Filter by category"
            >
              <Filter className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setIsCollapsed(true)
                setIsOpen(false)
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {/* Close button - Show on mobile and tablet portrait */}
            {(isMobile || (isTablet && typeof window !== 'undefined' && window.innerWidth < window.innerHeight)) && (
              <button
                onClick={() => {
                  setIsOpen(false)
                  setIsCollapsed(true)
                }}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Category Filters */}
        {showFilters && (
          <div className="px-4 pb-3 space-y-2">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Filter by Category:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-colors",
                  !selectedCategory 
                    ? "bg-[#53328A] text-white" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                )}
              >
                All
              </button>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1",
                    selectedCategory === key
                      ? "bg-[#53328A] text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  )}
                >
                  <span>{config.icon}</span>
                  <span>{config.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading news...</div>
        ) : fetchError ? (
          <div className="text-center py-8 px-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">Database Connection Error</h3>
              <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                {fetchError instanceof Error ? fetchError.message : 'Failed to fetch news items'}
              </p>
              <div className="text-xs text-red-600 dark:text-red-400 space-y-1 text-left">
                <p className="font-semibold">Troubleshooting steps:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check if your database server is running</li>
                  <li>Verify DATABASE_URL is configured correctly</li>
                  <li>If using Supabase, check if project is paused</li>
                  <li>Resume your Supabase project if paused</li>
                  <li>Try using a direct connection URL</li>
                  <li>Verify database migrations completed</li>
                  <li>Check firewall settings</li>
                </ul>
              </div>
            </div>
          </div>
        ) : finalData?.total === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No news items at the moment
          </div>
        ) : (
          <>
            {/* Critical News */}
            {grouped.critical.length > 0 && (
              <NewsSection
                title="CRITICAL"
                items={grouped.critical}
                config={URGENCY_CONFIG.critical}
                onMarkAsRead={handleMarkAsRead}
                onDismiss={handleDismiss}
              />
            )}

            {/* Important News */}
            {grouped.important.length > 0 && (
              <NewsSection
                title="IMPORTANT"
                items={grouped.important}
                config={URGENCY_CONFIG.important}
                onMarkAsRead={handleMarkAsRead}
                onDismiss={handleDismiss}
              />
            )}

            {/* Opportunity News */}
            {grouped.opportunity.length > 0 && (
              <NewsSection
                title="OPPORTUNITY"
                items={grouped.opportunity}
                config={URGENCY_CONFIG.opportunity}
                onMarkAsRead={handleMarkAsRead}
                onDismiss={handleDismiss}
              />
            )}

            {/* Warning News */}
            {grouped.warning.length > 0 && (
              <NewsSection
                title="WARNING"
                items={grouped.warning}
                config={URGENCY_CONFIG.warning}
                onMarkAsRead={handleMarkAsRead}
                onDismiss={handleDismiss}
              />
            )}

            {/* Growth News */}
            {grouped.growth.length > 0 && (
              <NewsSection
                title="GROWTH"
                items={grouped.growth}
                config={URGENCY_CONFIG.growth}
                onMarkAsRead={handleMarkAsRead}
                onDismiss={handleDismiss}
              />
            )}

            {/* Informational News */}
            {grouped.informational.length > 0 && (
              <NewsSection
                title="INFORMATIONAL"
                items={grouped.informational}
                config={URGENCY_CONFIG.informational}
                onMarkAsRead={handleMarkAsRead}
                onDismiss={handleDismiss}
              />
            )}
          </>
        )}
      </div>
      </div>
    </>
  )
}

function NewsSection({
  title,
  items,
  config,
  onMarkAsRead,
  onDismiss,
}: {
  title: string
  items: NewsItem[]
  config: typeof URGENCY_CONFIG.critical
  onMarkAsRead: (id: string) => void
  onDismiss: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">{config.icon}</span>
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-100">{title}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">({items.length})</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <NewsCard
            key={item.id}
            item={item}
            config={config}
            onMarkAsRead={onMarkAsRead}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  )
}

function NewsCard({
  item,
  config,
  onMarkAsRead,
  onDismiss,
}: {
  item: NewsItem
  config: typeof URGENCY_CONFIG.critical
  onMarkAsRead: (id: string) => void
  onDismiss: (id: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className={cn(
        'border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md',
        config.color,
        !item.isRead && 'ring-2 ring-offset-2 ring-opacity-50',
        !item.isRead && config.badgeColor.replace('bg-', 'ring-')
      )}
      onClick={() => {
        if (!item.isRead) {
          onMarkAsRead(item.id)
        }
        setIsExpanded(!isExpanded)
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <span className="text-sm mt-0.5">{item.icon || config.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <h4 className="font-medium text-sm leading-tight flex-1 text-gray-900 dark:text-gray-100">{item.title}</h4>
                {item.category && CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG] && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded flex-shrink-0",
                    CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG].color
                  )}>
                    {CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG].icon}
                  </span>
                )}
              </div>
              {item.summary && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {item.summary}
                </p>
              )}
              {item.category && (
                <div className="mt-1">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded",
                    CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG]?.color || "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  )}>
                    {CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG]?.label || item.category}
                  </span>
                </div>
              )}
            </div>
          </div>

          {isExpanded && (
            <div className="mt-2 space-y-2 text-xs">
              {item.description && (
                <p className="text-gray-700 dark:text-gray-300">{item.description}</p>
              )}

              {item.businessImpact && (
                <div className="bg-white/50 dark:bg-gray-700/50 rounded p-2">
                  <p className="font-semibold mb-1 dark:text-gray-200">Business Impact:</p>
                  <p className="text-gray-700 dark:text-gray-300">{item.businessImpact.impact}</p>
                </div>
              )}

              {item.recommendedActions && item.recommendedActions.length > 0 && (
                <div className="bg-white/50 dark:bg-gray-700/50 rounded p-2">
                  <p className="font-semibold mb-1 dark:text-gray-200">Recommended Actions:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    {item.recommendedActions.map((action: any, idx: number) => (
                      <li key={idx}>{action.action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.sourceUrl && (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <span>Read more</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
            {item.sourceName && <span>{item.sourceName}</span>}
            <span>•</span>
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {!item.isRead && (
          <div
            className={cn(
              'h-2 w-2 rounded-full flex-shrink-0 mt-1',
              config.badgeColor
            )}
          />
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDismiss(item.id)
          }}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

