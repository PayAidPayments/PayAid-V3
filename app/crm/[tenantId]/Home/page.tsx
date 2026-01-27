'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Calendar, 
  AlertCircle,
  Users,
  Briefcase,
  FileText,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { format } from 'date-fns'
import { DashboardLoading } from '@/components/ui/loading'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
// ModuleTopBar is now in layout.tsx
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
  Area,
  AreaChart,
  Label
} from 'recharts'

interface DashboardStats {
  dealsCreatedThisMonth: number
  revenueThisMonth: number
  dealsClosingThisMonth: number
  overdueTasks: number
  quarterlyPerformance: {
    quarter: string
    leadsCreated: number
    dealsCreated: number
    dealsWon: number
    revenue: number
  }[]
  pipelineByStage: {
    stage: string
    count: number
  }[]
  monthlyLeadCreation: {
    month: string
    count: number
  }[]
  topLeadSources: {
    name: string
    leadsCount: number
    conversionsCount: number
    totalValue: number
    conversionRate: number
  }[]
}

interface TasksViewData {
  myOpenActivitiesToday: any[]
  myOpenTasks: any[]
  myMeetingsToday: any[]
  myLeads: any[]
  myPipelineDealsByStage: { stage: string; count: number; totalValue: number }[]
  myDealsClosingThisMonth: any[]
}

// Design System Colors for charts (PayAid UI/UX Standards)
const TEAL_PRIMARY = '#0F766E' // Deep Teal
const BLUE_SECONDARY = '#0284C7' // Vibrant Blue
const EMERALD_SUCCESS = '#059669' // Success
const AMBER_ALERT = '#D97706' // Alert
const GOLD_ACCENT = '#FBBF24' // Accent Gold
const CHART_COLORS = [TEAL_PRIMARY, BLUE_SECONDARY, EMERALD_SUCCESS, GOLD_ACCENT, AMBER_ALERT, '#8B5CF6']

export default function CRMDashboardPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, tenant, token } = useAuthStore()
  
  // Get tenantId from URL params first, fallback to auth store
  // Handle both string and array cases (Next.js can return either)
  // Ensure tenantId is always defined (even if undefined, we'll handle it)
  const tenantIdParam = params?.tenantId
  const tenantIdFromParams = Array.isArray(tenantIdParam) 
    ? (tenantIdParam[0] || null)
    : (tenantIdParam as string | undefined || null)
  const tenantId: string | undefined = (tenantIdFromParams && typeof tenantIdFromParams === 'string' && tenantIdFromParams.trim()) 
    ? tenantIdFromParams 
    : (tenant?.id && typeof tenant.id === 'string' && tenant.id.trim() ? tenant.id : undefined)
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [tasksViewData, setTasksViewData] = useState<TasksViewData | null>(null)
  const [activityFeedData, setActivityFeedData] = useState<any[]>([])
  const [activityFilter, setActivityFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'financial-year' | 'year'>('month')
  // Profile menu and news handled by ModuleTopBar in layout
  const [isDark, setIsDark] = useState(false)
  
  // Refs to prevent duplicate API calls
  const fetchingStatsRef = useRef(false)
  const fetchingActivityRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Validate tenantId - redirect if missing
  useEffect(() => {
    // Ensure tenantId is a valid string
    if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) {
      // If no tenantId in URL and no tenant in store, redirect to CRM entry point
      if (!tenant?.id) {
        router.replace('/crm')
        return
      }
      // If tenantId is in auth store but not in URL, redirect to correct URL
      if (tenant.id && typeof tenant.id === 'string') {
        router.replace(`/crm/${tenant.id}/Home/`)
        return
      }
      router.replace('/crm')
      return
    }
    // If tenantId is in auth store but not in URL, redirect to correct URL
    if (!tenantIdFromParams && tenant?.id && typeof tenant.id === 'string') {
      router.replace(`/crm/${tenant.id}/Home/`)
      return
    }
  }, [tenantId, tenantIdFromParams, tenant?.id, router])

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const root = document.documentElement
      setIsDark(root.classList.contains('dark'))
    }
    
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])
  // Determine current view based on URL query params
  const viewParam = searchParams?.get('view')
  
  // Default view: 'manager' for admin/manager, 'tasks' for regular users
  const getInitialView = (): 'manager' | 'custom' | 'sales' | 'pipeline' | 'activity' | 'tasks' => {
    if (viewParam === 'custom') return 'custom'
    if (viewParam === 'sales') return 'sales'
    if (viewParam === 'activity') return 'activity'
    // Default to manager view for this page
    return user?.role === 'owner' || user?.role === 'admin' || user?.role === 'manager' ? 'manager' : 'tasks'
  }
  
  const [currentView, setCurrentView] = useState<'manager' | 'custom' | 'sales' | 'pipeline' | 'activity' | 'tasks'>(getInitialView())
  
  // Format period label based on timePeriod
  const getPeriodLabel = () => {
    switch (timePeriod) {
      case 'month': return 'This month'
      case 'quarter': return 'This quarter'
      case 'financial-year': return 'This financial year'
      case 'year': return 'This year'
      default: return 'This month'
    }
  }
  
  // Update view when URL query params change
  useEffect(() => {
    if (viewParam === 'custom' || viewParam === 'sales' || viewParam === 'activity') {
      setCurrentView(viewParam as 'custom' | 'sales' | 'activity')
    } else {
      setCurrentView(user?.role === 'owner' || user?.role === 'admin' || user?.role === 'manager' ? 'manager' : 'tasks')
    }
  }, [viewParam, user?.role])

  // Main data loading effect - only for stats and view-specific data
  useEffect(() => {
    // Don't fetch if tenantId is not available
    if (!tenantId) {
      return
    }

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal
    
    // Sequence API calls to avoid connection pool exhaustion
    const loadData = async () => {
      // Prevent duplicate calls
      if (fetchingStatsRef.current) {
        return
      }
      
      try {
        fetchingStatsRef.current = true
        
        // Load stats first (most important) - this will show the main dashboard
        await fetchDashboardStats(signal)
        
        // Only load view-specific data after stats are loaded and if not aborted
        // This allows the main dashboard to render faster
        if (!signal.aborted) {
          // Small delay to allow connection pool to recover
          await new Promise(resolve => setTimeout(resolve, 200))
          
          if (currentView === 'tasks') {
            await fetchTasksViewData()
          } else if (currentView === 'activity') {
            await fetchActivityFeed(signal)
          }
        }
      } catch (error: any) {
        // Ignore abort errors
        if (error?.name === 'AbortError') {
          return
        }
        console.error('Error loading dashboard data:', error)
        // Don't block UI - set loading to false even on error
        setLoading(false)
      } finally {
        fetchingStatsRef.current = false
      }
    }
    
    loadData()
    
    // Cleanup: abort on unmount or dependency change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      fetchingStatsRef.current = false
    }
  }, [tenantId, currentView, timePeriod]) // Removed activityFilter - it has its own effect

  // Separate effect for activity filter changes (only affects activity feed)
  useEffect(() => {
    // Only fetch if we're in activity view
    if (currentView !== 'activity') {
      return
    }
    
    // Cancel any in-flight activity requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal
    
    const loadActivity = async () => {
      if (fetchingActivityRef.current) {
        return
      }
      
      try {
        fetchingActivityRef.current = true
        await fetchActivityFeed(signal)
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return
        }
        console.error('Error loading activity feed:', error)
      } finally {
        fetchingActivityRef.current = false
      }
    }
    
    loadActivity()
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      fetchingActivityRef.current = false
    }
  }, [activityFilter, currentView])

  const fetchTasksViewData = async () => {
    try {
      const token = useAuthStore.getState().token
      if (!token) return

      const response = await fetch('/api/crm/dashboard/tasks-view', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tasks view data')
      }

      const data = await response.json()
      setTasksViewData(data)
    } catch (err) {
      console.error('Error fetching tasks view:', err)
    }
  }

  const fetchActivityFeed = async (signal?: AbortSignal) => {
    try {
      const token = useAuthStore.getState().token
      if (!token) return

      const params = new URLSearchParams()
      params.append('limit', '100')
      if (activityFilter) {
        params.append('type', activityFilter)
      }

      const response = await fetch(`/api/crm/dashboard/activity-feed?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal,
      })

      if (response.ok) {
        const data = await response.json()
        setActivityFeedData(data.activities || [])
      }
    } catch (err: any) {
      // Ignore abort errors
      if (err?.name === 'AbortError') {
        return
      }
      console.error('Error fetching activity feed:', err)
      setActivityFeedData([])
    }
  }


  const fetchDashboardStats = async (signal?: AbortSignal, retryCount = 0): Promise<void> => {
    const MAX_RETRIES = 2
    const RETRY_DELAY = 3000 // 3 seconds
    
    try {
      setLoading(true)
      setError(null)
      const token = useAuthStore.getState().token
      
      if (!token) {
        console.error('No authentication token found')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/crm/dashboard/stats?period=${timePeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal, // Add abort signal
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
        setLoading(false)
      } else if (response.status === 503) {
        // Handle service unavailable (pool exhaustion)
        const errorData = await response.json().catch(() => ({}))
        const retryAfter = errorData.retryAfter || 5
        
        // Check if request was aborted before retrying
        if (signal?.aborted) {
          return
        }
        
        if (retryCount < MAX_RETRIES) {
          setError(`Database busy. Retrying in ${retryAfter} seconds... (${retryCount + 1}/${MAX_RETRIES})`)
          // Retry after delay
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
          
          // Check again if aborted before retrying
          if (signal?.aborted) {
            return
          }
          
          return fetchDashboardStats(signal, retryCount + 1)
        } else {
          setError(errorData.message || 'Database temporarily unavailable. Please refresh the page in a moment.')
          setLoading(false)
          // Set default stats to prevent blocking
          setStats({
            dealsCreatedThisMonth: 0,
            revenueThisMonth: 0,
            dealsClosingThisMonth: 0,
            overdueTasks: 0,
            quarterlyPerformance: [
              { quarter: 'FY 2024-Q4', leadsCreated: 0, dealsCreated: 0, dealsWon: 0, revenue: 0 },
              { quarter: 'FY 2025-Q1', leadsCreated: 0, dealsCreated: 0, dealsWon: 0, revenue: 0 },
              { quarter: 'FY 2025-Q2', leadsCreated: 0, dealsCreated: 0, dealsWon: 0, revenue: 0 },
              { quarter: 'FY 2025-Q3', leadsCreated: 0, dealsCreated: 0, dealsWon: 0, revenue: 0 },
            ],
            pipelineByStage: [],
            monthlyLeadCreation: [],
            topLeadSources: [],
          })
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch dashboard stats')
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error?.name === 'AbortError' || signal?.aborted) {
        return
      }
      
      console.error('Failed to fetch dashboard stats:', error)
      
      // Check if aborted before retrying
      if (signal?.aborted) {
        return
      }
      
      // Retry on network errors
      if (retryCount < MAX_RETRIES && error.message?.includes('fetch')) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        
        // Check again if aborted before retrying
        if (signal?.aborted) {
          return
        }
        
        return fetchDashboardStats(signal, retryCount + 1)
      }
      
      setError(error.message || 'An unexpected error occurred while fetching data.')
      setLoading(false)
      // Set default stats to prevent blocking
      setStats({
        dealsCreatedThisMonth: 0,
        revenueThisMonth: 0,
        dealsClosingThisMonth: 0,
        overdueTasks: 0,
        quarterlyPerformance: [
          { quarter: 'FY 2024-Q4', leadsCreated: 0, dealsCreated: 0, dealsWon: 0, revenue: 0 },
          { quarter: 'FY 2025-Q1', leadsCreated: 0, dealsCreated: 0, dealsWon: 0, revenue: 0 },
          { quarter: 'FY 2025-Q2', leadsCreated: 0, dealsCreated: 0, dealsWon: 0, revenue: 0 },
          { quarter: 'FY 2025-Q3', leadsCreated: 0, dealsCreated: 0, dealsWon: 0, revenue: 0 },
        ],
        pipelineByStage: [],
        monthlyLeadCreation: [],
        topLeadSources: [],
      })
    }
  }

  // Show loading if tenantId is not available yet or not a valid string
  if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) {
    return <DashboardLoading message="Loading CRM dashboard..." />
  }

  if (loading) {
    return <DashboardLoading message="Loading CRM dashboard..." />
  }

  // Prepare chart data
  const pipelineChartData = stats?.pipelineByStage.map((item, idx) => ({
    name: item.stage.charAt(0).toUpperCase() + item.stage.slice(1),
    value: item.count,
    fill: CHART_COLORS[idx % CHART_COLORS.length]
  })) || []

  const monthlyLeadData = stats?.monthlyLeadCreation.map(item => ({
    month: item.month,
    leads: item.count
  })) || []

  // Map quarterly performance data for the chart - use actual data from API
  const quarterlyRevenueData = stats?.quarterlyPerformance?.map(q => ({
    quarter: q.quarter,
    revenue: q.revenue,
    deals: q.dealsWon
  })) || []

  const topLeadSourcesData = stats?.topLeadSources || []

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative transition-colors">
      {/* Welcome Banner - Enhanced - Design System Colors */}
      <div className="bg-gradient-to-r from-teal-primary to-blue-secondary text-white px-6 py-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name || 'User'}! 👋
            </h1>
            {tenant && (
              <p className="text-blue-100 flex items-center gap-2">
                <span>🏢</span>
                {tenant.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timePeriod}
              onChange={(e) => {
                setTimePeriod(e.target.value as 'month' | 'quarter' | 'financial-year' | 'year')
              }}
              className="text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-[#53328A] font-medium cursor-pointer"
              style={{ color: '#53328A' }}
            >
              <option value="month" className="text-[#53328A] bg-white">This Month</option>
              <option value="quarter" className="text-[#53328A] bg-white">This Quarter</option>
              <option value="financial-year" className="text-[#53328A] bg-white">This Financial Year</option>
              <option value="year" className="text-[#53328A] bg-white">This Year</option>
            </select>
            <select 
              value={currentView}
              onChange={(e) => {
                if (!tenantId || typeof tenantId !== 'string') return
                const view = e.target.value
                // Navigate to different pages based on selection
                switch(view) {
                  case 'tasks':
                    router.push(`/crm/${tenantId}/Tasks/`)
                    break
                  case 'manager':
                    router.push(`/crm/${tenantId}/Home/`)
                    break
                  case 'custom':
                    router.push(`/crm/${tenantId}/Home/?view=custom`)
                    break
                  case 'sales':
                    router.push(`/crm/${tenantId}/Home/?view=sales`)
                    break
                  case 'pipeline':
                    router.push(`/crm/${tenantId}/Deals/`)
                    break
                  case 'activity':
                    router.push(`/crm/${tenantId}/Home/?view=activity`)
                    break
                  default:
                    router.push(`/crm/${tenantId}/Home/`)
                }
              }}
              className="text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-[#53328A] font-medium cursor-pointer"
              style={{ color: '#53328A' }}
            >
              <option value="manager" className="text-[#53328A] bg-white">Manager&apos;s Home</option>
              <option value="tasks" className="text-[#53328A] bg-white">Tasks View</option>
              <option value="activity" className="text-[#53328A] bg-white">Activity Feed</option>
              <option value="pipeline" className="text-[#53328A] bg-white">Pipeline View</option>
              <option value="sales" className="text-[#53328A] bg-white">Sales Performance</option>
              <option value="custom" className="text-[#53328A] bg-white">Custom Dashboard</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400 font-medium">Error:</p>
          <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div className="p-6 space-y-6 overflow-y-auto" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Conditional Rendering: Tasks View vs Activity Feed vs Manager View */}
        {currentView === 'tasks' ? (
          // Tasks View for regular users
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Tasks & Activities</h2>
            
            {/* My Open Activities for Today */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">My Open Activities for Today</CardTitle>
                <CardDescription>Tasks and activities due today</CardDescription>
              </CardHeader>
              <CardContent>
                {tasksViewData?.myOpenActivitiesToday && tasksViewData.myOpenActivitiesToday.length > 0 ? (
                  <div className="space-y-2">
                    {tasksViewData.myOpenActivitiesToday.map((activity) => (
                      <div key={activity.id} className="p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{activity.title}</p>
                            {activity.contact && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {activity.contact.name || activity.contact.email || 'Contact'}
                                {activity.contact.company && typeof activity.contact.company === 'string' && ` - ${activity.contact.company}`}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(activity.dueDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No activities for today</p>
                )}
              </CardContent>
            </Card>

            {/* My Open Tasks */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">My Open Tasks</CardTitle>
                <CardDescription>All pending and in-progress tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {tasksViewData?.myOpenTasks && tasksViewData.myOpenTasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasksViewData.myOpenTasks.map((task) => (
                      <div key={task.id} className="p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
                            {task.contact && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {task.contact.name || task.contact.email || 'Contact'}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : 'No due date'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No open tasks</p>
                )}
              </CardContent>
            </Card>

            {/* My Meetings for Today */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">My Meetings for Today</CardTitle>
                <CardDescription>Scheduled meetings today</CardDescription>
              </CardHeader>
              <CardContent>
                {tasksViewData?.myMeetingsToday && tasksViewData.myMeetingsToday.length > 0 ? (
                  <div className="space-y-2">
                    {tasksViewData.myMeetingsToday.map((meeting) => (
                      <div key={meeting.id} className="p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{meeting.title}</p>
                            {meeting.contact && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {meeting.contact.name || meeting.contact.email || 'Contact'}
                                {meeting.contact.company && typeof meeting.contact.company === 'string' && ` - ${meeting.contact.company}`}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {meeting.dueDate ? new Date(meeting.dueDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'No time'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No meetings scheduled for today</p>
                )}
              </CardContent>
            </Card>

            {/* My Leads */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">My Leads</CardTitle>
                <CardDescription>Recent leads assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                {tasksViewData?.myLeads && tasksViewData.myLeads.length > 0 ? (
                  <div className="space-y-2">
                    {tasksViewData.myLeads.map((lead) => (
                      <div key={lead.id} className="p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{lead.name || 'Unnamed Lead'}</p>
                            {lead.company && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {typeof lead.company === 'string' ? lead.company : lead.company.name || 'No company'}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Score: {lead.leadScore || 0}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No leads assigned</p>
                )}
              </CardContent>
            </Card>

            {/* My Pipeline Deals By Stage */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">My Pipeline Deals By Stage</CardTitle>
                <CardDescription>Deals distribution across pipeline stages</CardDescription>
              </CardHeader>
              <CardContent>
                {tasksViewData?.myPipelineDealsByStage && tasksViewData.myPipelineDealsByStage.length > 0 ? (
                  <div className="space-y-2">
                    {tasksViewData.myPipelineDealsByStage.map((stage) => (
                      <div key={stage.stage} className="p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{stage.stage}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{stage.count || 0} deals</p>
                          </div>
                          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            ₹{(stage.totalValue || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No pipeline deals</p>
                )}
              </CardContent>
            </Card>

            {/* My Deals Closing This Month */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">My Deals Closing This Month</CardTitle>
                <CardDescription>Deals expected to close this month</CardDescription>
              </CardHeader>
              <CardContent>
                {tasksViewData?.myDealsClosingThisMonth && tasksViewData.myDealsClosingThisMonth.length > 0 ? (
                  <div className="space-y-2">
                    {tasksViewData.myDealsClosingThisMonth.map((deal) => (
                      <div key={deal.id} className="p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{deal.name}</p>
                            {deal.contact && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {deal.contact.name || deal.contact.email || 'Contact'}
                                {deal.contact.company && typeof deal.contact.company === 'string' && ` - ${deal.contact.company}`}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-blue-600 dark:text-blue-400">₹{(deal.value || 0).toLocaleString('en-IN')}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('en-IN') : 'No date'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No deals closing this month</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : currentView === 'activity' ? (
          // Activity Feed View - Chronological timeline of all activities
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Activity Feed</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Chronological timeline of all activities across your team
                </p>
              </div>
              <select
                value={activityFilter}
                onChange={(e) => {
                  setActivityFilter(e.target.value)
                }}
                className="text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300"
              >
                <option value="">All Activities</option>
                <option value="task">Tasks</option>
                <option value="call">Calls</option>
                <option value="email">Emails</option>
                <option value="meeting">Meetings</option>
                <option value="deal">Deals</option>
              </select>
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>All activities sorted by most recent</CardDescription>
              </CardHeader>
              <CardContent>
                {activityFeedData.length > 0 ? (
                  <div className="space-y-4">
                    {activityFeedData.map((activity, index) => (
                      <div
                        key={activity.id}
                        className="flex gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        {/* Timeline indicator */}
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            activity.type === 'task' ? 'bg-blue-500' :
                            activity.type === 'call' ? 'bg-green-500' :
                            activity.type === 'email' ? 'bg-purple-500' :
                            activity.type === 'meeting' ? 'bg-orange-500' :
                            activity.type === 'deal' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`} />
                          {index < activityFeedData.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2" />
                          )}
                        </div>

                        {/* Activity content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={
                                  activity.type === 'task' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  activity.type === 'call' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  activity.type === 'email' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                  activity.type === 'meeting' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                  activity.type === 'deal' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                }>
                                  {activity.type}
                                </Badge>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                  {activity.title}
                                </h3>
                              </div>
                              {activity.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {activity.description}
                                </p>
                              )}
                              {activity.contact && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <Users className="h-4 w-4" />
                                  <span>{activity.contact.name || activity.contact.email || 'Contact'}</span>
                                  {activity.contact.company && (
                                    <span className="text-gray-500">• {typeof activity.contact.company === 'string' ? activity.contact.company : activity.contact.company.name}</span>
                                  )}
                                </div>
                              )}
                              {activity.metadata && (
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-500">
                                  {activity.metadata.duration && (
                                    <span>Duration: {activity.metadata.duration}m</span>
                                  )}
                                  {activity.metadata.value && (
                                    <span>Value: ₹{activity.metadata.value.toLocaleString('en-IN')}</span>
                                  )}
                                  {activity.metadata.stage && (
                                    <span>Stage: {activity.metadata.stage}</span>
                                  )}
                                  {activity.status && (
                                    <span>Status: {activity.status}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {format(new Date(activity.timestamp), 'MMM dd, yyyy')}
                              <br />
                              {format(new Date(activity.timestamp), 'HH:mm')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No activities found. Activities will appear here as your team creates tasks, makes calls, sends emails, and updates deals.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Manager View (default for admin/manager)
          <>
        {/* KPI Cards - Design System Compliant with Animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href={tenantId ? `/crm/${tenantId}/Deals?filter=created&period=${timePeriod}` : '#'}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 * 0.1, duration: 0.3 }}
            >
              <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-150 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Deals Created</CardTitle>
                  <div className="w-12 h-12 bg-teal-primary/10 rounded-lg flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-teal-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold text-gray-900 mb-1">
                    {stats?.dealsCreatedThisMonth || 0}
                  </div>
                  <p className="text-sm text-emerald-success flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    <span className="font-medium">{getPeriodLabel()}</span>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          <Link href={tenantId ? `/crm/${tenantId}/Deals?filter=won&period=${timePeriod}` : '#'}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * 0.1, duration: 0.3 }}
            >
              <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-150 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Revenue</CardTitle>
                  <div className="w-12 h-12 bg-emerald-success/10 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-success font-bold text-lg">₹</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold text-gray-900 mb-1">
                    ₹{stats?.revenueThisMonth?.toLocaleString('en-IN') || '0'}
                  </div>
                  <p className="text-sm text-emerald-success flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    <span className="font-medium">{getPeriodLabel()}</span>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          <Link href={tenantId ? `/crm/${tenantId}/Deals?filter=closing&period=${timePeriod}` : '#'}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * 0.1, duration: 0.3 }}
            >
              <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-150 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Deals Closing</CardTitle>
                  <div className="w-12 h-12 bg-blue-secondary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-secondary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold text-gray-900 mb-1">
                    {stats?.dealsClosingThisMonth || 0}
                  </div>
                  <p className="text-sm text-emerald-success flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    <span className="font-medium">{getPeriodLabel()}</span>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          <Link href={tenantId ? `/crm/${tenantId}/Tasks?filter=overdue` : '#'}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 * 0.1, duration: 0.3 }}
            >
              <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-150 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Overdue Tasks</CardTitle>
                  <div className="w-12 h-12 bg-red-error/10 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-error" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold text-gray-900 mb-1">
                    {stats?.overdueTasks || 0}
                  </div>
                  <p className="text-sm text-red-error flex items-center gap-1">
                    <ArrowDownRight className="w-3 h-3" />
                    <span className="font-medium">Requires attention</span>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        </div>

        {/* Charts Row - Modern Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline by Stage - Pie Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Pipeline by Stage</CardTitle>
              <CardDescription>Distribution of deals across pipeline stages</CardDescription>
            </CardHeader>
            <CardContent>
              {pipelineChartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pipelineChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
                          const RADIAN = Math.PI / 180
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                          const x = cx + radius * Math.cos(-midAngle * RADIAN)
                          const y = cy + radius * Math.sin(-midAngle * RADIAN)
                          
                          return (
                            <text 
                              x={x} 
                              y={y} 
                              fill={isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)'}
                              textAnchor={x > cx ? 'start' : 'end'} 
                              dominantBaseline="central"
                              fontSize={12}
                              fontWeight={500}
                            >
                              {`${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                            </text>
                          )
                        }}
                        labelLine={false}
                      >
                        {pipelineChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [value, 'Deals']}
                        contentStyle={{
                          backgroundColor: isDark ? 'rgb(31, 41, 55)' : '#fff',
                          color: isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)',
                          border: `1px solid ${TEAL_PRIMARY}`,
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>No pipeline data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Lead Creation - Area Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Monthly Lead Creation</CardTitle>
              <CardDescription>Lead generation trend over time</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyLeadData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyLeadData}>
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={TEAL_PRIMARY} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={TEAL_PRIMARY} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                      <XAxis 
                        dataKey="month" 
                        stroke={isDark ? '#D1D5DB' : '#666'}
                        tick={{ fontSize: 12, fill: isDark ? '#D1D5DB' : '#666' }}
                      />
                      <YAxis 
                        stroke={isDark ? '#D1D5DB' : '#666'}
                        tick={{ fontSize: 12, fill: isDark ? '#D1D5DB' : '#666' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDark ? 'rgb(31, 41, 55)' : '#fff',
                          color: isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)',
                          border: `1px solid ${TEAL_PRIMARY}`,
                          borderRadius: '8px',
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="leads" 
                        stroke={TEAL_PRIMARY} 
                        fillOpacity={1} 
                        fill="url(#colorLeads)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>No lead creation data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quarterly Performance and TOP 10 Lead Sources - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quarterly Performance - Bar Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-1">
              <CardTitle className="text-lg font-semibold pl-5">Quarterly Performance Overview</CardTitle>
              <CardDescription className="pl-5">Revenue and deals won by quarter (Q1-Q4)</CardDescription>
            </CardHeader>
            <CardContent className="pb-0 pl-5 pt-8">
              {quarterlyRevenueData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={quarterlyRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                      <XAxis 
                        dataKey="quarter" 
                        stroke={isDark ? '#D1D5DB' : '#666'}
                        tick={{ fontSize: 12, fill: isDark ? '#D1D5DB' : '#666' }}
                      />
                      <YAxis 
                        yAxisId="left" 
                        stroke={isDark ? '#D1D5DB' : '#666'}
                        tick={{ fontSize: 12, fill: isDark ? '#D1D5DB' : '#666' }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke={isDark ? '#D1D5DB' : '#666'}
                        tick={{ fontSize: 12, fill: isDark ? '#D1D5DB' : '#666' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDark ? 'rgb(31, 41, 55)' : '#fff',
                          color: isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)',
                          border: `1px solid ${TEAL_PRIMARY}`,
                          borderRadius: '8px',
                        }}
                        formatter={(value: any, name?: string) => {
                          if (name === 'revenue') return [`₹${value.toLocaleString('en-IN')}`, 'Revenue']
                          return [value, 'Deals Won']
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ color: isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)' }}
                      />
                      <Bar yAxisId="left" dataKey="revenue" fill={TEAL_PRIMARY} name="Revenue (₹)" radius={[8, 8, 0, 0]} />
                      <Bar yAxisId="right" dataKey="deals" fill={GOLD_ACCENT} name="Deals Won" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>No quarterly performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* TOP 10 Lead Sources */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">TOP 10 Lead Sources</CardTitle>
              <CardDescription>Best performing lead sources</CardDescription>
            </CardHeader>
            <CardContent>
              {topLeadSourcesData.length > 0 ? (
                <div className="h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={topLeadSourcesData} 
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                      <XAxis 
                        type="number" 
                        stroke={isDark ? '#D1D5DB' : '#666'}
                        tick={{ fontSize: 12, fill: isDark ? '#D1D5DB' : '#666' }}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke={isDark ? '#D1D5DB' : '#666'}
                        width={180}
                        tick={{ fontSize: 11, fill: isDark ? '#D1D5DB' : '#666' }}
                        interval={0}
                        angle={0}
                        textAnchor="end"
                        dx={-5}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDark ? 'rgb(31, 41, 55)' : '#fff',
                          color: isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)',
                          border: `1px solid ${TEAL_PRIMARY}`,
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            // Sort payload to show leads first, then conversions
                            const sortedPayload = [...payload].sort((a, b) => {
                              if (a.dataKey === 'leadsCount') return -1
                              if (b.dataKey === 'leadsCount') return 1
                              if (a.dataKey === 'conversionsCount') return -1
                              if (b.dataKey === 'conversionsCount') return 1
                              return 0
                            })
                            
                            return (
                              <div className="bg-white dark:bg-gray-800 border border-purple-600 rounded-lg p-3 shadow-lg">
                                <p className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{label}</p>
                                {sortedPayload.map((entry: any, index: number) => {
                                  let label = entry.name
                                  let value = entry.value
                                  
                                  if (entry.dataKey === 'leadsCount') {
                                    label = 'Leads'
                                    value = value
                                  } else if (entry.dataKey === 'conversionsCount') {
                                    label = 'Conversions'
                                    value = value
                                  } else if (entry.dataKey === 'totalValue') {
                                    label = 'Total Value'
                                    value = `₹${value.toLocaleString('en-IN')}`
                                  } else if (entry.dataKey === 'conversionRate') {
                                    label = 'Conversion Rate'
                                    value = `${value.toFixed(1)}%`
                                  }
                                  
                                  return (
                                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                                      <span className="font-medium">{label}:</span> {value}
                                    </p>
                                  )
                                })}
                              </div>
                            )
                          }
                          return null
                        }}
                        labelStyle={{ color: isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)' }}
                      />
                      <Legend 
                        wrapperStyle={{
                          fontSize: '12px',
                          color: isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)',
                        }}
                      />
                      <Bar dataKey="leadsCount" fill={TEAL_PRIMARY} name="Leads" radius={[0, 8, 8, 0]} />
                      <Bar dataKey="conversionsCount" fill={GOLD_ACCENT} name="Conversions" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[500px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>No lead source data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quarterly Performance Table - Enhanced */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Detailed Quarterly Metrics</CardTitle>
            <CardDescription>Comprehensive quarterly breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-3 font-semibold text-gray-700">Metric</th>
                    {stats?.quarterlyPerformance.map((q, idx) => (
                      <th key={idx} className="text-right p-3 font-semibold text-gray-700">{q.quarter}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium">Leads Created</td>
                    {stats?.quarterlyPerformance.map((q, idx) => (
                      <td key={idx} className="text-right p-3">{q.leadsCreated.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium">Deals Created</td>
                    {stats?.quarterlyPerformance.map((q, idx) => (
                      <td key={idx} className="text-right p-3">{q.dealsCreated.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium">Deals Won</td>
                    {stats?.quarterlyPerformance.map((q, idx) => (
                      <td key={idx} className="text-right p-3 font-semibold text-green-600">{q.dealsWon.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium">Revenue</td>
                    {stats?.quarterlyPerformance.map((q, idx) => (
                      <td key={idx} className="text-right p-3 font-semibold text-blue-600">₹{q.revenue.toLocaleString('en-IN')}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </div>
  )
}
