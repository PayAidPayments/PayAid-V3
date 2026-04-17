'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { format, isAfter, isBefore, isToday, isYesterday, startOfDay, subDays } from 'date-fns'
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Filter,
  Flame,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  Users,
  Video,
} from 'lucide-react'
import type { ActivityItem } from './types'

const ActivityDetailDrawer = dynamic(() => import('./ActivityDetailDrawer'))

type GroupByMode = 'time' | 'contact' | 'deal' | 'bundle'
type SortMode = 'recent' | 'oldest' | 'priority'

const VIEW_TABS = [
  'All Activity',
  'Needs Action',
  'My Queue',
  'Team Feed',
  'Calls',
  'Emails',
  'WhatsApp',
  'Meetings',
  'Tasks',
  'System Events',
  'High-Value Deals',
  'Customer Timeline',
] as const

interface ActivitiesCommandCenterProps {
  activities: ActivityItem[]
  activityFilter: string
  onActivityFilterChange: (value: string) => void
  hasMoreFromServer?: boolean
  isLoadingMoreFromServer?: boolean
  onLoadMoreFromServer?: () => void
}

interface TimelineCluster {
  key: string
  heading: string
  activities: ActivityItem[]
}

interface TimelineGroup {
  id: string
  label: string
  clusters: TimelineCluster[]
}

const typeStyles: Record<string, string> = {
  task: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700',
  call: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-700',
  email: 'bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-900/40 dark:text-violet-100 dark:border-violet-700',
  meeting: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-700',
  whatsapp: 'bg-green-100 text-green-900 border-green-300 dark:bg-green-900/40 dark:text-green-100 dark:border-green-700',
  deal: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-900/40 dark:text-rose-100 dark:border-rose-700',
}

const getCompanyName = (company: string | { name?: string } | null | undefined) => {
  if (!company) return null
  if (typeof company === 'string') return company
  return company.name || null
}

const getActivityTypeIcon = (type: string) => {
  const iconClass = 'h-3.5 w-3.5'
  switch (type) {
    case 'call':
      return <Phone className={iconClass} />
    case 'email':
      return <Mail className={iconClass} />
    case 'meeting':
      return <Video className={iconClass} />
    case 'whatsapp':
      return <MessageCircle className={iconClass} />
    case 'task':
      return <CalendarClock className={iconClass} />
    default:
      return <Clock3 className={iconClass} />
  }
}

const isClosedStatus = (activity: ActivityItem) => {
  const value = `${activity.status || activity.metadata?.outcome || ''}`.toLowerCase()
  return ['done', 'completed', 'closed', 'won', 'sent', 'successful'].some((token) => value.includes(token))
}

const getTaskPriorityFromActivity = (activity: ActivityItem): 'low' | 'medium' | 'high' => {
  const explicitPriority = `${activity.metadata?.priority || ''}`.toLowerCase()
  if (explicitPriority === 'high' || explicitPriority === 'medium' || explicitPriority === 'low') {
    return explicitPriority
  }
  if (isOverdue(activity)) return 'high'
  if (needsResponse(activity)) return 'medium'
  return 'low'
}

const isOverdue = (activity: ActivityItem) => {
  if (!activity.metadata?.dueDate) return false
  const dueDate = new Date(activity.metadata.dueDate)
  return isBefore(dueDate, startOfDay(new Date())) && !isClosedStatus(activity)
}

const isDueToday = (activity: ActivityItem) => {
  if (!activity.metadata?.dueDate) return false
  return isToday(new Date(activity.metadata.dueDate))
}

const needsResponse = (activity: ActivityItem) => {
  const outcomeText = `${activity.status || activity.metadata?.outcome || ''}`.toLowerCase()
  if (activity.type === 'email' || activity.type === 'whatsapp') {
    return !outcomeText.includes('replied') && !isClosedStatus(activity)
  }
  return outcomeText.includes('follow') || outcomeText.includes('waiting')
}

const getPriorityScore = (activity: ActivityItem) => {
  let score = 0
  if (isOverdue(activity)) score += 5
  if (isDueToday(activity)) score += 3
  if (needsResponse(activity)) score += 4
  if ((activity.metadata?.value || 0) >= 500000) score += 4
  if (!activity.metadata?.nextStep && !isClosedStatus(activity)) score += 2
  return score
}

const getBundleName = (activity: ActivityItem) => {
  if (activity.metadata?.value && activity.metadata.value > 200000) return 'Deal progression'
  if (activity.type === 'email' || activity.type === 'whatsapp') return 'Customer communication'
  if (activity.type === 'call' || activity.type === 'meeting') return 'Lead follow-up'
  if (isOverdue(activity)) return 'Support risk'
  return 'Payment-related touchpoints'
}

function formatRelativeBucket(dateValue: string) {
  const date = new Date(dateValue)
  const now = new Date()
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  if (isAfter(date, subDays(now, 7))) return 'Earlier this week'
  if (isAfter(date, subDays(now, 14))) return 'Last week'
  return 'Older'
}

function buildTimelineGroups(items: ActivityItem[], groupBy: GroupByMode): TimelineGroup[] {
  const bucketMap = new Map<string, Map<string, TimelineCluster>>()

  items.forEach((activity) => {
    const bucketLabel = formatRelativeBucket(activity.timestamp)
    if (!bucketMap.has(bucketLabel)) bucketMap.set(bucketLabel, new Map())

    let clusterKey = ''
    let clusterHeading = ''

    if (groupBy === 'contact') {
      clusterKey = activity.contact?.id || activity.contact?.email || 'unlinked-contact'
      clusterHeading = activity.contact?.name || activity.contact?.email || 'Unlinked contact'
    } else if (groupBy === 'deal') {
      clusterKey = activity.metadata?.stage || 'general-pipeline'
      clusterHeading = activity.metadata?.stage ? `${activity.metadata.stage} stage` : 'General pipeline'
    } else if (groupBy === 'bundle') {
      clusterKey = getBundleName(activity)
      clusterHeading = getBundleName(activity)
    } else {
      clusterKey = `${activity.contact?.id || activity.contact?.email || activity.type}-${bucketLabel}`
      clusterHeading =
        activity.contact?.name ||
        activity.contact?.email ||
        getCompanyName(activity.contact?.company) ||
        'General activity cluster'
    }

    const clusterMap = bucketMap.get(bucketLabel)!
    if (!clusterMap.has(clusterKey)) {
      clusterMap.set(clusterKey, { key: clusterKey, heading: clusterHeading, activities: [] })
    }
    clusterMap.get(clusterKey)!.activities.push(activity)
  })

  const order = ['Today', 'Yesterday', 'Earlier this week', 'Last week', 'Older']
  return order
    .map((label) => {
      const clusters = Array.from(bucketMap.get(label)?.values() || [])
      return {
        id: label.toLowerCase().replace(/\s+/g, '-'),
        label,
        clusters,
      }
    })
    .filter((group) => group.clusters.length > 0)
}

export function ActivitiesCommandCenter({
  activities,
  activityFilter,
  onActivityFilterChange,
  hasMoreFromServer = false,
  isLoadingMoreFromServer = false,
  onLoadMoreFromServer,
}: ActivitiesCommandCenterProps) {
  const params = useParams()
  const router = useRouter()
  const tenantId = (params?.tenantId as string) || ''
  const [activeView, setActiveView] = useState<(typeof VIEW_TABS)[number]>('All Activity')
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [groupByMode, setGroupByMode] = useState<GroupByMode>('time')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('Last 30 days')
  const [savedView, setSavedView] = useState('Manager Default')
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({})
  const [visibleGroupCount, setVisibleGroupCount] = useState(3)
  const [windowSize, setWindowSize] = useState(120)

  const mappedTypeFilter = useMemo(() => {
    if (activeView === 'Calls') return 'call'
    if (activeView === 'Emails') return 'email'
    if (activeView === 'WhatsApp') return 'whatsapp'
    if (activeView === 'Meetings') return 'meeting'
    if (activeView === 'Tasks') return 'task'
    if (activeView === 'System Events') return 'system'
    return ''
  }, [activeView])

  useEffect(() => {
    if (mappedTypeFilter !== activityFilter) {
      onActivityFilterChange(mappedTypeFilter)
    }
  }, [mappedTypeFilter, activityFilter, onActivityFilterChange])

  const filteredActivities = useMemo(() => {
    let base = [...activities]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      base = base.filter((activity) => {
        const company = getCompanyName(activity.contact?.company) || ''
        return (
          activity.title?.toLowerCase().includes(q) ||
          activity.description?.toLowerCase().includes(q) ||
          activity.contact?.name?.toLowerCase().includes(q) ||
          activity.contact?.email?.toLowerCase().includes(q) ||
          company.toLowerCase().includes(q)
        )
      })
    }

    switch (activeView) {
      case 'Needs Action':
        base = base.filter((activity) => !isClosedStatus(activity) && (needsResponse(activity) || isDueToday(activity) || isOverdue(activity)))
        break
      case 'My Queue':
        base = base.filter((activity) => !isClosedStatus(activity))
        break
      case 'System Events':
        base = base.filter((activity) => activity.type === 'system' || activity.type === 'automation')
        break
      case 'High-Value Deals':
        base = base.filter((activity) => (activity.metadata?.value || 0) >= 500000)
        break
      default:
        break
    }

    if (sortMode === 'oldest') {
      base.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    } else if (sortMode === 'priority') {
      base.sort((a, b) => getPriorityScore(b) - getPriorityScore(a))
    } else {
      base.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }

    return base.slice(0, windowSize)
  }, [activities, activeView, searchQuery, sortMode, windowSize])

  const kpis = useMemo(() => {
    const weekStart = subDays(new Date(), 7)
    return {
      overdue: filteredActivities.filter(isOverdue).length,
      dueToday: filteredActivities.filter(isDueToday).length,
      awaitingReply: filteredActivities.filter(needsResponse).length,
      meetingsBooked: filteredActivities.filter((item) => item.type === 'meeting').length,
      callsCompleted: filteredActivities.filter((item) => item.type === 'call' && isClosedStatus(item)).length,
      tasksDone: filteredActivities.filter((item) => item.type === 'task' && isClosedStatus(item) && isAfter(new Date(item.timestamp), weekStart)).length,
    }
  }, [filteredActivities])

  const priorityQueue = useMemo(() => {
    const items = filteredActivities.filter((activity) => !isClosedStatus(activity))
    return {
      needsResponse: items.filter(needsResponse).slice(0, 6),
      dueToday: items.filter(isDueToday).slice(0, 6),
      overdue: items.filter(isOverdue).slice(0, 6),
      followUpRequired: items.filter((item) => !item.metadata?.nextStep).slice(0, 6),
      waitingOnCustomer: items.filter((item) => `${item.status || item.metadata?.outcome || ''}`.toLowerCase().includes('waiting')).slice(0, 6),
      highValue: items.filter((item) => (item.metadata?.value || 0) >= 500000).slice(0, 6),
    }
  }, [filteredActivities])

  const timelineGroups = useMemo(() => {
    return buildTimelineGroups(filteredActivities, groupByMode)
  }, [filteredActivities, groupByMode])

  const groupedVisible = timelineGroups.slice(0, visibleGroupCount)

  const openDetails = (activity: ActivityItem) => {
    setSelectedActivity(activity)
    setDrawerOpen(true)
  }

  const extractEntityId = (id: string) => {
    const parts = id.split('_')
    if (parts.length <= 1) return id
    return parts.slice(1).join('_')
  }

  const runReplyAction = (activity: ActivityItem) => {
    if (activity.type === 'email' && activity.contact?.id && tenantId) {
      router.push(`/crm/${tenantId}/inbox?contactId=${activity.contact.id}&compose=1&channel=email`)
      return
    }
    if (activity.type === 'task' && tenantId) {
      router.push(`/crm/${tenantId}/Tasks/${extractEntityId(activity.id)}`)
      return
    }
    if (activity.type === 'call' && activity.contact?.id && tenantId) {
      router.push(`/crm/${tenantId}/Dialer?contactId=${activity.contact.id}`)
      return
    }
    if (activity.type === 'meeting' && tenantId) {
      router.push(`/crm/${tenantId}/Meetings`)
      return
    }
    if (tenantId) {
      router.push(`/crm/${tenantId}/inbox`)
    }
  }

  const runCreateTaskAction = (activity: ActivityItem) => {
    if (!tenantId) return
    const params = new URLSearchParams()
    if (activity.contact?.id) params.set('contactId', activity.contact.id)
    if (activity.title) params.set('title', `Follow up: ${activity.title}`)
    if (activity.metadata?.dueDate) params.set('dueDate', activity.metadata.dueDate)
    params.set('priority', getTaskPriorityFromActivity(activity))
    router.push(`/crm/${tenantId}/Tasks/new?${params.toString()}`)
  }

  const runScheduleMeetingAction = (activity: ActivityItem) => {
    if (!tenantId) return
    const params = new URLSearchParams()
    params.set('type', 'meeting')
    if (activity.contact?.id) params.set('contactId', activity.contact.id)
    if (activity.title) params.set('title', `Meeting: ${activity.title}`)
    if (activity.metadata?.dueDate) params.set('dueDate', activity.metadata.dueDate)
    params.set('priority', 'high')
    router.push(`/crm/${tenantId}/Tasks/new?${params.toString()}`)
  }

  const runAssignAction = (activity: ActivityItem) => {
    if (!tenantId) return
    if (activity.type === 'task') {
      router.push(`/crm/${tenantId}/Tasks/${extractEntityId(activity.id)}`)
      return
    }
    if (activity.contact?.id) {
      router.push(`/crm/${tenantId}/Tasks/new?contactId=${activity.contact.id}&title=${encodeURIComponent(`Assign owner: ${activity.title}`)}&priority=high`)
      return
    }
    if (activity.type === 'deal') {
      router.push(`/crm/${tenantId}/Deals/${extractEntityId(activity.id)}/Edit`)
      return
    }
    router.push(`/crm/${tenantId}/Tasks`)
  }

  const runUpdateStageAction = (activity: ActivityItem) => {
    if (!tenantId) return
    if (activity.type === 'deal') {
      router.push(`/crm/${tenantId}/Deals/${extractEntityId(activity.id)}/Edit`)
      return
    }
    if (activity.type === 'task') {
      router.push(`/crm/${tenantId}/Tasks/${extractEntityId(activity.id)}`)
      return
    }
    if (activity.contact?.id) {
      router.push(`/crm/${tenantId}/Deals/new?contactId=${activity.contact.id}`)
      return
    }
    router.push(`/crm/${tenantId}/Deals`)
  }

  const handleKpiCardClick = (label: string) => {
    switch (label) {
      case 'Overdue':
        setActiveView('Needs Action')
        setSortMode('priority')
        onActivityFilterChange('task')
        break
      case 'Due Today':
        setActiveView('My Queue')
        onActivityFilterChange('task')
        break
      case 'Awaiting Reply':
        setActiveView('Needs Action')
        onActivityFilterChange('email')
        break
      case 'Meetings Booked':
        setActiveView('Meetings')
        break
      case 'Calls Completed':
        setActiveView('Calls')
        break
      case 'Tasks Done (7d)':
        setActiveView('Tasks')
        break
      default:
        break
    }
  }

  const renderQueueSection = (title: string, items: ActivityItem[], tone: 'risk' | 'pending' | 'normal') => {
    const toneClasses =
      tone === 'risk'
        ? 'border-red-200/80 dark:border-red-900/30'
        : tone === 'pending'
          ? 'border-amber-200/80 dark:border-amber-900/30'
          : 'border-slate-200/80 dark:border-slate-800'

    return (
      <Card className={`rounded-2xl shadow-sm ${toneClasses}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <CardDescription className="text-xs">{items.length ? `${items.length} activities` : 'No pending items'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length ? (
            items.map((activity) => (
              <button
                key={activity.id}
                type="button"
                className="w-full text-left rounded-xl border border-slate-200/80 dark:border-slate-800 px-3 py-2 hover:shadow-md hover:-translate-y-[1px] transition-all"
                onClick={() => openDetails(activity)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{activity.title}</p>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {format(new Date(activity.timestamp), 'HH:mm')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {activity.contact?.name || activity.contact?.email || 'Unlinked contact'}
                </p>
              </button>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3 text-xs text-slate-500 dark:text-slate-400">
              Queue clear. No matching actions right now.
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const toggleCluster = (key: string) => {
    setExpandedClusters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="relative z-10 pointer-events-auto space-y-5">
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardContent className="pt-5 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Activities Command Center</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Focus on the next best action before diving into full history.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              >
                <option>Today</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Quarter to date</option>
              </select>
              <select
                value={savedView}
                onChange={(event) => setSavedView(event.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              >
                <option>Manager Default</option>
                <option>SDR Queue</option>
                <option>Account Review</option>
              </select>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search contact, deal, activity"
                className="min-w-[220px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
              <Button size="sm">Quick Action</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div data-testid="activities-kpi-strip" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        {[
          { label: 'Overdue', value: kpis.overdue, tone: 'text-red-600 dark:text-red-400' },
          { label: 'Due Today', value: kpis.dueToday, tone: 'text-amber-600 dark:text-amber-400' },
          { label: 'Awaiting Reply', value: kpis.awaitingReply, tone: 'text-blue-600 dark:text-blue-400' },
          { label: 'Meetings Booked', value: kpis.meetingsBooked, tone: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Calls Completed', value: kpis.callsCompleted, tone: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Tasks Done (7d)', value: kpis.tasksDone, tone: 'text-slate-700 dark:text-slate-200' },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleKpiCardClick(item.label)}
            className="text-left"
          >
            <Card className="h-28 w-full rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all">
              <CardContent className="h-full flex flex-col justify-between py-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className={`text-2xl font-semibold ${item.tone}`}>{item.value}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveView(tab)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeView === tab
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
              <Filter className="h-3.5 w-3.5" />
              Filter bar
            </div>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            >
              <option value="recent">Sort: Most recent</option>
              <option value="oldest">Sort: Oldest first</option>
              <option value="priority">Sort: Highest priority</option>
            </select>
            <select
              value={groupByMode}
              onChange={(event) => setGroupByMode(event.target.value as GroupByMode)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            >
              <option value="time">Group by: Time</option>
              <option value="contact">Group by: Contact</option>
              <option value="deal">Group by: Deal stage</option>
              <option value="bundle">Group by: Smart bundle</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-3 space-y-4">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Filters and scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3">Saved view: {savedView}</div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3">Date range: {dateRange}</div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3">Current mode: {activeView}</div>
            </CardContent>
          </Card>
          <div data-testid="activities-priority-queue" className="space-y-4">
            {renderQueueSection('Needs response', priorityQueue.needsResponse, 'pending')}
            {renderQueueSection('Due today', priorityQueue.dueToday, 'pending')}
            {renderQueueSection('Overdue', priorityQueue.overdue, 'risk')}
            {renderQueueSection('Follow-up required', priorityQueue.followUpRequired, 'normal')}
            {renderQueueSection('Waiting on customer', priorityQueue.waitingOnCustomer, 'normal')}
            {renderQueueSection('High-value deal actions', priorityQueue.highValue, 'risk')}
          </div>
        </div>

        <div className="xl:col-span-6 space-y-4" data-testid="activities-timeline">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Structured timeline</CardTitle>
              <CardDescription className="text-xs">
                Grouped by day with clustered entities. Low-value system events are collapsed by default.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupedVisible.length ? (
                groupedVisible.map((group) => (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{group.label}</h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {group.clusters.reduce((sum, cluster) => sum + cluster.activities.length, 0)} events
                      </span>
                    </div>
                    {group.clusters.map((cluster) => {
                      const hasLowValue = cluster.activities.some((item) => item.type === 'system' || item.type === 'automation')
                      const expanded = expandedClusters[cluster.key] ?? !hasLowValue
                      const rows = expanded ? cluster.activities : cluster.activities.filter((item) => item.type !== 'system' && item.type !== 'automation')
                      return (
                        <Card key={cluster.key} className="rounded-xl border border-slate-200/80 dark:border-slate-800" data-testid="activity-cluster">
                          <CardContent className="pt-3 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{cluster.heading}</p>
                              {hasLowValue ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"
                                  onClick={() => toggleCluster(cluster.key)}
                                >
                                  {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                  {expanded ? 'Collapse low-value events' : 'Expand grouped events'}
                                </button>
                              ) : null}
                            </div>
                            <div className="space-y-2">
                              {rows.map((activity) => {
                                const companyName = getCompanyName(activity.contact?.company)
                                const riskClass = isOverdue(activity)
                                  ? 'border-red-200 bg-red-50/30 dark:border-red-900/40 dark:bg-red-950/20'
                                  : needsResponse(activity)
                                    ? 'border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20'
                                    : 'border-slate-200/80 dark:border-slate-800'
                                return (
                                  <article
                                    key={activity.id}
                                    data-testid="activity-card"
                                    className={`rounded-xl border p-3 hover:shadow-md hover:-translate-y-[1px] transition-all ${riskClass}`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="space-y-2 flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <Badge className={`border text-[11px] font-semibold uppercase ${typeStyles[activity.type] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600'}`}>
                                            <span className="mr-1.5 inline-flex">{getActivityTypeIcon(activity.type)}</span>
                                            {activity.type}
                                          </Badge>
                                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                            {activity.contact?.name || activity.contact?.email || companyName || 'Unlinked record'}
                                          </p>
                                        </div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.title}</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                          {activity.description || 'No event description available'}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                          <span>Owner: {activity.metadata?.owner || activity.metadata?.assignedToId || 'Unassigned'}</span>
                                          <span>Outcome: {activity.metadata?.outcome || activity.status || 'Pending'}</span>
                                          {activity.metadata?.stage ? <span>Stage: {activity.metadata.stage}</span> : null}
                                          {activity.metadata?.value ? <span>Value: {formatINRForDisplay(activity.metadata.value)}</span> : null}
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          {format(new Date(activity.timestamp), 'dd MMM')}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          {format(new Date(activity.timestamp), 'HH:mm')}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => runReplyAction(activity)}>
                                        Reply
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => runCreateTaskAction(activity)}>
                                        Create task
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => runScheduleMeetingAction(activity)}>
                                        Schedule meeting
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => runAssignAction(activity)}>
                                        Assign
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => runUpdateStageAction(activity)}>
                                        Update stage
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openDetails(activity)}>
                                        Open details
                                      </Button>
                                    </div>
                                  </article>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No matching activity yet</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Try changing filters or switch to Team Feed to widen the scope.
                  </p>
                </div>
              )}
              {timelineGroups.length > visibleGroupCount ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setVisibleGroupCount((count) => count + 2)}
                >
                  Load older activity groups
                </Button>
              ) : null}
              {activities.length > filteredActivities.length ? (
                <Button size="sm" variant="ghost" onClick={() => setWindowSize((size) => size + 80)}>
                  Load more timeline rows
                </Button>
              ) : null}
              {hasMoreFromServer && onLoadMoreFromServer ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onLoadMoreFromServer}
                  disabled={isLoadingMoreFromServer}
                >
                  {isLoadingMoreFromServer ? 'Loading older activities...' : 'Load older activities from server'}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm" data-testid="activities-ai-summary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                AI daily briefing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p>{kpis.overdue + kpis.awaitingReply} activities need attention.</p>
              <p>{priorityQueue.highValue.length} high-value deal activities need follow-up.</p>
              <p>{kpis.awaitingReply} conversations are awaiting a response.</p>
              <p>{filteredActivities.filter((item) => !item.metadata?.nextStep && !isClosedStatus(item)).length} records are missing a next step.</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Team pulse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between"><span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />Active reps</span><strong>8</strong></div>
              <div className="flex items-center justify-between"><span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Tasks closed today</span><strong>{kpis.tasksDone}</strong></div>
              <div className="flex items-center justify-between"><span className="inline-flex items-center gap-1"><Flame className="h-3.5 w-3.5" />Hot leads untouched</span><strong>{priorityQueue.highValue.length}</strong></div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm" data-testid="activities-smart-recommendations">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Smart recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p className="inline-flex items-start gap-2"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-red-500" />Escalate overdue items older than 48 hours.</p>
              <p className="inline-flex items-start gap-2"><CalendarDays className="h-3.5 w-3.5 mt-0.5 text-amber-500" />Create next step for records with missing owner notes.</p>
              <p className="inline-flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-500" />Bundle follow-ups by account to reduce context switching.</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Activity legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" />Overdue / risk</div>
              <div className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" />Pending / waiting</div>
              <div className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Completed / positive</div>
              <div className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" />Informational</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ActivityDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        activity={selectedActivity}
      />
    </div>
  )
}
