'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  TrendingUp, 
  Eye, 
  Clock, 
  Globe, 
  MousePointerClick,
  Filter,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { format, formatDistanceToNow } from 'date-fns'

interface VisitorInsight {
  visitorId: string
  sessionCount: number
  totalPageViews: number
  firstVisit: string
  lastVisit: string
  averageSessionDuration: number
  totalDuration: number
  pages: Array<{
    path: string
    title: string
    views: number
    timeSpent: number
  }>
  device: string
  browser: string
  os: string
  country?: string
  city?: string
  referrer?: string
  intentScore: number
  isHighIntent: boolean
  events: Array<{
    type: string
    name: string
    count: number
    lastOccurred: string
  }>
  website?: {
    id: string
    name: string
    domain: string
  }
}

interface VisitorStats {
  totalVisitors: number
  highIntentVisitors: number
  totalSessions: number
  totalPageViews: number
  averageIntentScore: number
  topCountries: Array<{
    country: string
    count: number
  }>
}

export default function VisitorsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [visitors, setVisitors] = useState<VisitorInsight[]>([])
  const [stats, setStats] = useState<VisitorStats | null>(null)
  const [filter, setFilter] = useState<'all' | 'high-intent'>('all')
  const [selectedWebsite, setSelectedWebsite] = useState<string>('all')

  useEffect(() => {
    fetchVisitors()
  }, [tenantId, token, filter, selectedWebsite])

  const fetchVisitors = async () => {
    try {
      setLoading(true)
      if (!token) return

      const params = new URLSearchParams()
      if (filter === 'high-intent') {
        params.append('highIntentOnly', 'true')
      }
      if (selectedWebsite !== 'all') {
        params.append('websiteId', selectedWebsite)
      }

      const response = await fetch(`/api/crm/visitors?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setVisitors(data.visitors || [])
        setStats(data.stats || null)
      } else {
        console.error('Failed to fetch visitors')
        setVisitors([])
        setStats(null)
      }
    } catch (error) {
      console.error('Error fetching visitors:', error)
      setVisitors([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const getIntentColor = (score: number) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400'
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getIntentBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
    if (score >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
    return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
  }

  if (loading) {
    return <PageLoading message="Loading visitor intelligence..." fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Anonymous Visitor Tracking</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Identify high-intent visitors in real-time and convert traffic into leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchVisitors}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">Total Visitors</CardTitle>
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats?.totalVisitors || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {stats?.highIntentVisitors || 0} high-intent
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">Total Sessions</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats?.totalSessions || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Across all websites
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">Page Views</CardTitle>
            <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats?.totalPageViews || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Total views
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">Avg Intent Score</CardTitle>
            <MousePointerClick className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats?.averageIntentScore?.toFixed(0) || '0'}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Out of 100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Visitor Intelligence</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={selectedWebsite}
                onChange={(e) => setSelectedWebsite(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="all">All Websites</option>
                {/* Website options can be added here */}
              </select>
              <button
                onClick={() => setFilter(filter === 'all' ? 'high-intent' : 'all')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                  filter === 'high-intent'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Filter className="h-4 w-4" />
                {filter === 'high-intent' ? 'High Intent Only' : 'All Visitors'}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {visitors.length > 0 ? (
            <div className="space-y-4">
              {visitors.map((visitor) => (
                <Card key={visitor.visitorId} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            Visitor {visitor.visitorId.substring(0, 12)}...
                          </h3>
                          <Badge className={getIntentBgColor(visitor.intentScore)}>
                            Intent: {visitor.intentScore}
                          </Badge>
                          {visitor.isHighIntent && (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              High Intent
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            {visitor.country || 'Unknown'} {visitor.city ? `, ${visitor.city}` : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDistanceToNow(new Date(visitor.lastVisit), { addSuffix: true })}
                          </span>
                          <span>{visitor.device} • {visitor.browser}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {visitor.intentScore}
                        </div>
                        <p className="text-xs text-gray-500">Intent Score</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Sessions</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {visitor.sessionCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Page Views</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {visitor.totalPageViews}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Avg Duration</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {Math.round(visitor.averageSessionDuration)}s
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Events</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {visitor.events.length}
                        </p>
                      </div>
                    </div>

                    {visitor.pages.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Pages Visited:</p>
                        <div className="flex flex-wrap gap-2">
                          {visitor.pages.slice(0, 5).map((page, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {page.path} ({page.views}x)
                            </Badge>
                          ))}
                          {visitor.pages.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{visitor.pages.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {visitor.events.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Events:</p>
                        <div className="flex flex-wrap gap-2">
                          {visitor.events.map((event, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {event.name} ({event.count}x)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {visitor.website && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Website:</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {visitor.website.name} {visitor.website.domain && `(${visitor.website.domain})`}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {filter === 'high-intent'
                  ? 'No high-intent visitors found. High-intent visitors will appear here based on their behavior (multiple sessions, form submissions, scroll depth, etc.).'
                  : 'No visitors tracked yet. Add the tracking script to your website to start tracking anonymous visitors.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
