'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { ActivitiesCommandCenter } from '../Home/activities/ActivitiesCommandCenter'
import type { ActivityItem } from '../Home/activities/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CRMActivitiesPage() {
  const params = useParams()
  const tenantIdParam = params?.tenantId
  const tenantId = Array.isArray(tenantIdParam) ? (tenantIdParam[0] || '') : ((tenantIdParam as string) || '')
  const { token } = useAuthStore()
  const [activityFeedData, setActivityFeedData] = useState<ActivityItem[]>([])
  const [activityFilter, setActivityFilter] = useState<string>('')
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId || !token) {
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const signal = controller.signal

    const fetchActivityFeed = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        // Keep initial payload small for faster first render.
        params.append('limit', '50')
        params.append('mode', 'light')
        if (activityFilter) {
          params.append('type', activityFilter)
        }

        const response = await fetch(`/api/crm/dashboard/activity-feed?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal,
        })

        if (!response.ok) {
          throw new Error('Failed to load activities')
        }

        const data = await response.json()
        const activities = data?.activities
        setActivityFeedData(Array.isArray(activities) ? activities : [])
        setNextCursor(typeof data?.nextCursor === 'string' ? data.nextCursor : null)
        setHasMore(Boolean(data?.hasMore))
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        setActivityFeedData([])
        setNextCursor(null)
        setHasMore(false)
        setError(err?.message || 'Unable to load activities.')
      } finally {
        setLoading(false)
      }
    }

    fetchActivityFeed()
    return () => controller.abort()
  }, [tenantId, token, activityFilter])

  const loadMoreActivities = async () => {
    if (!tenantId || !token || !nextCursor || isLoadingMore) return
    try {
      setIsLoadingMore(true)
      const params = new URLSearchParams()
      params.append('limit', '50')
      params.append('mode', 'light')
      params.append('cursor', nextCursor)
      if (activityFilter) {
        params.append('type', activityFilter)
      }
      const response = await fetch(`/api/crm/dashboard/activity-feed?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to load older activities')
      const data = await response.json()
      const activities = Array.isArray(data?.activities) ? data.activities : []
      setActivityFeedData((prev) => [...prev, ...activities])
      setNextCursor(typeof data?.nextCursor === 'string' ? data.nextCursor : null)
      setHasMore(Boolean(data?.hasMore))
    } catch (err: any) {
      setError(err?.message || 'Unable to load older activities.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <div className="space-y-5">
      {loading ? (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardContent className="py-10 text-center text-sm text-slate-600 dark:text-slate-400">
            Loading Activities Command Center...
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="rounded-2xl border border-red-200 dark:border-red-900/30 shadow-sm">
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Link href={tenantId ? `/crm/${tenantId}/Activities` : '/crm'}>
              <Button size="sm" variant="outline">Retry</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ActivitiesCommandCenter
          activities={activityFeedData}
          activityFilter={activityFilter}
          onActivityFilterChange={setActivityFilter}
          hasMoreFromServer={hasMore}
          isLoadingMoreFromServer={isLoadingMore}
          onLoadMoreFromServer={loadMoreActivities}
        />
      )}
    </div>
  )
}
