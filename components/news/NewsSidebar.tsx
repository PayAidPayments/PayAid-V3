'use client'

import { useState, useEffect } from 'react'
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
    color: 'bg-red-50 border-red-200 text-red-800',
    icon: '🔴',
    badgeColor: 'bg-red-500',
  },
  important: {
    label: 'IMPORTANT',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: '🟡',
    badgeColor: 'bg-yellow-500',
  },
  informational: {
    label: 'INFORMATIONAL',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: '🟢',
    badgeColor: 'bg-blue-500',
  },
  opportunity: {
    label: 'OPPORTUNITY',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
    icon: '💡',
    badgeColor: 'bg-purple-500',
  },
  warning: {
    label: 'WARNING',
    color: 'bg-orange-50 border-orange-200 text-orange-800',
    icon: '⚠️',
    badgeColor: 'bg-orange-500',
  },
  growth: {
    label: 'GROWTH',
    color: 'bg-green-50 border-green-200 text-green-800',
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const queryClient = useQueryClient()
  
  // Persist collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('newsSidebarCollapsed', String(isCollapsed))
    }
  }, [isCollapsed])
  
  // News sidebar is now an overlay - no need to modify main content classes
  // Removed CSS class manipulation since news sidebar doesn't affect main content layout

  const { token } = useAuthStore()

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
      return response.json()
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
    markAsReadMutation.mutate(id)
  }

  const handleDismiss = (id: string) => {
    dismissMutation.mutate(id)
  }

  const grouped = data?.grouped || {
    critical: [],
    important: [],
    informational: [],
    opportunity: [],
    warning: [],
    growth: [],
  }

  const unreadCount = data?.unreadCount || 0

  if (isCollapsed) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[60] pointer-events-auto">
        <button
          onClick={() => {
            setIsCollapsed(false)
            setIsOpen(true)
          }}
          className="bg-[#53328A] text-white p-3 rounded-l-lg shadow-lg hover:bg-[#6B42A3] transition-colors relative"
          aria-label="Open news sidebar"
          style={{ zIndex: 60 }}
        >
          <ChevronLeft className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Overlay when news sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => {
            setIsOpen(false)
            setIsCollapsed(true)
          }}
        />
      )}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📰</span>
            <h2 className="font-semibold text-gray-900">Industry Intelligence</h2>
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
                "p-1 hover:bg-gray-200 rounded transition-colors",
                selectedCategory && "bg-blue-100 text-blue-700"
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
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setIsOpen(false)
                setIsCollapsed(true)
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Category Filters */}
        {showFilters && (
          <div className="px-4 pb-3 space-y-2">
            <div className="text-xs font-medium text-gray-600 mb-2">Filter by Category:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-colors",
                  !selectedCategory 
                    ? "bg-[#53328A] text-white" 
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
          <div className="text-center text-gray-500 py-8">Loading news...</div>
        ) : fetchError ? (
          <div className="text-center py-8 px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Database Connection Error</h3>
              <p className="text-sm text-red-700 mb-3">
                {fetchError instanceof Error ? fetchError.message : 'Failed to fetch news items'}
              </p>
              <div className="text-xs text-red-600 space-y-1 text-left">
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
        ) : data?.total === 0 ? (
          <div className="text-center text-gray-500 py-8">
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
        <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
        <span className="text-xs text-gray-500">({items.length})</span>
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
                <h4 className="font-medium text-sm leading-tight flex-1">{item.title}</h4>
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
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {item.summary}
                </p>
              )}
              {item.category && (
                <div className="mt-1">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded",
                    CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG]?.color || "bg-gray-100 text-gray-700"
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
                <p className="text-gray-700">{item.description}</p>
              )}

              {item.businessImpact && (
                <div className="bg-white/50 rounded p-2">
                  <p className="font-semibold mb-1">Business Impact:</p>
                  <p className="text-gray-700">{item.businessImpact.impact}</p>
                </div>
              )}

              {item.recommendedActions && item.recommendedActions.length > 0 && (
                <div className="bg-white/50 rounded p-2">
                  <p className="font-semibold mb-1">Recommended Actions:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
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
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  <span>Read more</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
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
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

