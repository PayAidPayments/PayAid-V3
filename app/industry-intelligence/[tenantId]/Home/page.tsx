'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Newspaper, TrendingUp, BarChart3, Search, AlertTriangle, 
  ExternalLink, Plus, Eye, MapPin, IndianRupee, ArrowRight,
  Target, TrendingDown, Activity
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// PayAid Brand Colors
const PURPLE_PRIMARY = '#53328A'
const GOLD_ACCENT = '#F5C700'
const SUCCESS = '#059669'
const INFO = '#0284C7'
const ERROR = '#DC2626'
const CHART_COLORS = [PURPLE_PRIMARY, GOLD_ACCENT, SUCCESS, INFO, '#8B5CF6', '#FCD34D']

interface NewsItem {
  id: string
  title: string
  summary?: string
  urgency: string
  category: string
  source: string
  sourceUrl?: string
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

interface Competitor {
  id: string
  name: string
  website?: string
  industry?: string
  priceTrackingEnabled: boolean
  locationTrackingEnabled: boolean
  prices?: Array<{
    id: string
    productName: string
    price: number
    currency: string
    lastCheckedAt: string
  }>
  locations?: Array<{
    id: string
    address: string
    city?: string
    isActive: boolean
  }>
  alerts?: Array<{
    id: string
    type: string
    message: string
    isRead: boolean
    createdAt: string
  }>
  _count?: {
    prices: number
    locations: number
    alerts: number
  }
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

export default function IndustryIntelligenceDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant, token } = useAuthStore()
  const moduleConfig = getModuleConfig('industry-intelligence') || getModuleConfig('crm')!

  // Fetch news
  const { data: newsData, isLoading: newsLoading, error: newsError } = useQuery<NewsResponse>({
    queryKey: ['industry-intelligence-news', tenantId],
    queryFn: async () => {
      if (!token) throw new Error('No token')
      const response = await fetch('/api/news?limit=20', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch news')
      return response.json()
    },
    enabled: !!token && !!tenantId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  // Fetch competitors
  const { data: competitorsData, isLoading: competitorsLoading, error: competitorsError } = useQuery<{ competitors: Competitor[] }>({
    queryKey: ['industry-intelligence-competitors', tenantId],
    queryFn: async () => {
      if (!token) throw new Error('No token')
      const response = await fetch('/api/competitors/track', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        // If 403 or module not licensed, return empty
        if (response.status === 403) return { competitors: [] }
        throw new Error('Failed to fetch competitors')
      }
      return response.json()
    },
    enabled: !!token && !!tenantId,
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  })

  const news = newsData || { newsItems: [], grouped: { critical: [], important: [], informational: [], opportunity: [], warning: [], growth: [] }, unreadCount: 0, total: 0 }
  const competitors = competitorsData?.competitors || []

  // Calculate metrics
  const criticalNews = news.grouped?.critical?.length || 0
  const unreadNews = news.unreadCount || 0
  const trackedCompetitors = competitors.length
  const activeAlerts = competitors.reduce((sum, comp) => sum + (comp._count?.alerts || 0), 0)
  const priceChanges = competitors.reduce((sum, comp) => {
    if (comp.prices && comp.prices.length > 1) {
      // Check if there are price changes (simplified)
      return sum + 1
    }
    return sum
  }, 0)

  const heroMetrics = [
    { label: 'Unread News', value: unreadNews.toString(), icon: <Newspaper className="w-5 h-5" />, color: 'purple' as const },
    { label: 'Tracked Competitors', value: trackedCompetitors.toString(), icon: <Target className="w-5 h-5" />, color: 'info' as const },
    { label: 'Active Alerts', value: activeAlerts.toString(), icon: <AlertTriangle className="w-5 h-5" />, color: 'warning' as const },
  ]

  // Prepare news urgency chart data
  const newsUrgencyData = [
    { name: 'Critical', value: news.grouped?.critical?.length || 0, fill: ERROR },
    { name: 'Important', value: news.grouped?.important?.length || 0, fill: GOLD_ACCENT },
    { name: 'Informational', value: news.grouped?.informational?.length || 0, fill: INFO },
    { name: 'Opportunity', value: news.grouped?.opportunity?.length || 0, fill: PURPLE_PRIMARY },
    { name: 'Warning', value: news.grouped?.warning?.length || 0, fill: '#F97316' },
    { name: 'Growth', value: news.grouped?.growth?.length || 0, fill: SUCCESS },
  ].filter(item => item.value > 0)

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Industry Intelligence"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      {(newsError || competitorsError) && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Error loading data</p>
          <p className="text-red-600 text-sm">{newsError?.message || competitorsError?.message}</p>
        </div>
      )}

      <div className="p-6 space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href={`/dashboard/news`}>
            <GlassCard delay={0} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Newspaper className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">View All News</CardTitle>
                      <CardDescription>Browse industry news and updates</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </GlassCard>
          </Link>

          <Link href={`/dashboard/competitors`}>
            <GlassCard delay={0.1} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gold-100 rounded-lg">
                      <Target className="h-6 w-6 text-gold-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Competitor Tracking</CardTitle>
                      <CardDescription>Monitor competitors and prices</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </GlassCard>
          </Link>
        </div>

        {/* News Overview */}
        <GlassCard delay={0.2}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Industry News Overview</CardTitle>
                <CardDescription>Latest industry news and updates relevant to your business</CardDescription>
              </div>
              <Link href="/dashboard/news">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {newsLoading ? (
              <div className="text-center py-8">
                <PageLoading message="Loading news..." fullScreen={false} />
              </div>
            ) : news.newsItems && news.newsItems.length > 0 ? (
              <div className="space-y-4">
                {/* News Urgency Chart */}
                {newsUrgencyData.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">News by Urgency</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={newsUrgencyData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {newsUrgencyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Recent News Items */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Recent News</h4>
                  {news.newsItems.slice(0, 5).map((item) => {
                    const urgencyConfig = URGENCY_CONFIG[item.urgency] || URGENCY_CONFIG.informational
                    return (
                      <div
                        key={item.id}
                        className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                          !item.isRead ? 'border-purple-300 bg-purple-50/50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgencyConfig.color}`}>
                                {urgencyConfig.icon} {urgencyConfig.label}
                              </span>
                              {!item.isRead && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  New
                                </span>
                              )}
                            </div>
                            <h5 className="font-semibold text-gray-900 mb-1">{item.title}</h5>
                            {item.summary && (
                              <p className="text-sm text-gray-600 mb-2">{item.summary}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{item.category}</span>
                              <span>•</span>
                              <span>{new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                          {item.sourceUrl && (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Newspaper className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No news items available. Check back later for updates.</p>
              </div>
            )}
          </CardContent>
        </GlassCard>

        {/* Competitor Tracking */}
        <GlassCard delay={0.3}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Competitor Tracking</CardTitle>
                <CardDescription>Monitor competitor prices, locations, and market movements</CardDescription>
              </div>
              <Link href="/dashboard/competitors">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Competitor
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {competitorsLoading ? (
              <div className="text-center py-8">
                <PageLoading message="Loading competitors..." fullScreen={false} />
              </div>
            ) : competitors.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {competitors.slice(0, 6).map((competitor) => (
                    <div
                      key={competitor.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="font-semibold text-gray-900">{competitor.name}</h5>
                          {competitor.industry && (
                            <p className="text-xs text-gray-500 mt-1">{competitor.industry}</p>
                          )}
                        </div>
                        <Target className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="space-y-2 text-sm">
                        {competitor.priceTrackingEnabled && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <IndianRupee className="w-4 h-4" />
                            <span>{competitor._count?.prices || 0} prices tracked</span>
                          </div>
                        )}
                        {competitor.locationTrackingEnabled && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{competitor._count?.locations || 0} locations</span>
                          </div>
                        )}
                        {competitor._count && competitor._count.alerts > 0 && (
                          <div className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{competitor._count.alerts} alerts</span>
                          </div>
                        )}
                      </div>
                      {competitor.website && (
                        <a
                          href={competitor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
                        >
                          Visit Website <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="mb-4">No competitors tracked yet.</p>
                <Link href="/dashboard/competitors">
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Start Tracking Competitors
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </GlassCard>

        {/* Market Trends Summary */}
        <GlassCard delay={0.4}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Market Trends</CardTitle>
            <CardDescription>Industry trends and market intelligence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Market trends and analytics coming soon.</p>
              <p className="text-sm mt-2">Track market movements, price trends, and industry insights.</p>
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
