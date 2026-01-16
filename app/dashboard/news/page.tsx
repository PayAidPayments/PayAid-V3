'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { Newspaper, ExternalLink, Filter, X } from 'lucide-react'
import Link from 'next/link'

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

const URGENCY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  critical: {
    label: 'CRITICAL',
    color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    icon: '🔴',
  },
  important: {
    label: 'IMPORTANT',
    color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
    icon: '🟡',
  },
  informational: {
    label: 'INFORMATIONAL',
    color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    icon: '🟢',
  },
  opportunity: {
    label: 'OPPORTUNITY',
    color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300',
    icon: '💡',
  },
  warning: {
    label: 'WARNING',
    color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300',
    icon: '⚠️',
  },
  growth: {
    label: 'GROWTH',
    color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
    icon: '📈',
  },
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  'government-alerts': {
    label: 'Government Alerts',
    icon: '🏛️',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  'competitor-tracking': {
    label: 'Competitor Intelligence',
    icon: '🔍',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  'market-trends': {
    label: 'Market Trends',
    icon: '📈',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  'supplier-intelligence': {
    label: 'Supplier Intelligence',
    icon: '🚚',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  'technology-trends': {
    label: 'Technology & Trends',
    icon: '💻',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  },
}

export default function NewsPage() {
  const { token } = useAuthStore()
  const [news, setNews] = useState<NewsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedUrgency, setSelectedUrgency] = useState<string | null>(null)

  useEffect(() => {
    fetchNews()
  }, [token])

  const fetchNews = async () => {
    try {
      setLoading(true)
      if (!token) return

      const categoryParam = selectedCategory ? `&category=${selectedCategory}` : ''
      const urgencyParam = selectedUrgency ? `&urgency=${selectedUrgency}` : ''
      // Note: Industry filtering is handled automatically by the API based on tenant's industry

      const response = await fetch(`/api/news?limit=100${categoryParam}${urgencyParam}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setNews(data)
      }
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (newsId: string) => {
    try {
      if (!token) return

      await fetch(`/api/news/${newsId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      // Refresh news
      fetchNews()
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const displayNews = selectedCategory && news?.grouped
    ? Object.values(news.grouped).flat().filter(item => item.category === selectedCategory)
    : selectedUrgency && news?.grouped
    ? news.grouped[selectedUrgency as keyof typeof news.grouped] || []
    : news?.newsItems || []

  const categories = Object.keys(CATEGORY_CONFIG)
  const urgencies = Object.keys(URGENCY_CONFIG)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Newspaper className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                Industry Intelligence
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Stay updated with industry news, competitor tracking, and market trends
              </p>
            </div>
            {news && (
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {news.unreadCount} unread
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {news.total} total items
                </p>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedUrgency === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedUrgency(null)}
            >
              All Urgency
            </Button>
            {urgencies.map((urg) => (
              <Button
                key={urg}
                variant={selectedUrgency === urg ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedUrgency(urg)}
              >
                {URGENCY_CONFIG[urg].icon} {URGENCY_CONFIG[urg].label}
              </Button>
            ))}
          </div>
        </div>

        {/* News Items */}
        {loading ? (
          <PageLoading message="Loading news..." fullScreen={false} />
        ) : displayNews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Newspaper className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No news items found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedCategory || selectedUrgency
                  ? 'Try adjusting your filters'
                  : 'Check back later for updates'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {displayNews.map((item) => {
              const urgencyConfig = URGENCY_CONFIG[item.urgency] || URGENCY_CONFIG.informational
              const categoryConfig = CATEGORY_CONFIG[item.category] || {
                label: item.category,
                icon: '📰',
                color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
              }

              return (
                <Card
                  key={item.id}
                  className={`border-2 transition-all hover:shadow-lg ${
                    !item.isRead ? 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/10' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgencyConfig.color}`}>
                            {urgencyConfig.icon} {urgencyConfig.label}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryConfig.color}`}>
                            {categoryConfig.icon} {categoryConfig.label}
                          </span>
                          {!item.isRead && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              New
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        {item.summary && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {item.summary}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!item.isRead && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsRead(item.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {item.description && (
                    <CardContent>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {item.description}
                      </p>
                      {item.businessImpact && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                            Business Impact:
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            {typeof item.businessImpact === 'string'
                              ? item.businessImpact
                              : JSON.stringify(item.businessImpact)}
                          </p>
                        </div>
                      )}
                      {item.recommendedActions && item.recommendedActions.length > 0 && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm font-semibold text-green-900 dark:text-green-200 mb-2">
                            Recommended Actions:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-green-800 dark:text-green-300">
                            {item.recommendedActions.map((action: any, idx: number) => (
                              <li key={idx}>
                                {typeof action === 'string' ? action : action.action || JSON.stringify(action)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Source: {item.sourceName || item.source}</span>
                        <span>
                          {new Date(item.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

