'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  ArrowDownRight,
  Building2,
  Handshake,
  Target,
  IndianRupee,
  Plus,
  Mail,
  CheckCircle,
  Activity,
  Zap,
  Sparkles
} from 'lucide-react'
import { format } from 'date-fns'
import { formatINR, formatINRCompact, formatINRForDisplay } from '@/lib/utils/formatINR'
import { DashboardLoading } from '@/components/ui/loading'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
// ModuleTopBar is now in layout.tsx
// Lazy load AI components for better performance
import dynamic from 'next/dynamic'
import { QuickActionsPanel } from '@/components/crm/QuickActionsPanel'
import { CommandPalette } from '@/components/crm/CommandPalette'
import { AIScoreBadge, calculateDealScore, calculateContactScore } from '@/components/ai/AIScoreBadge'

// Lazy load AI components - only load when needed (client-side only)
// Using explicit dynamic imports with ssr: false to prevent any server-side bundling
const FloatingAIAssistant = dynamic(
  () => import('@/components/ai/FloatingAIAssistant').then(mod => ({ default: mod.FloatingAIAssistant })),
  { ssr: false, loading: () => null }
)
const AICommandCenter = dynamic(
  () => import('@/components/ai/AICommandCenter').then(mod => ({ default: mod.AICommandCenter })),
  { ssr: false, loading: () => null }
)
const AIInsightsAndAlerts = dynamic(
  () => import('@/components/ai/AIInsightsAndAlerts').then(mod => ({ default: mod.AIInsightsAndAlerts })),
  { ssr: false, loading: () => null }
)
const AIQuestionInput = dynamic(
  () => import('@/components/ai/AIQuestionInput').then(mod => ({ default: mod.AIQuestionInput })),
  { ssr: false, loading: () => null }
)
const PredictiveAnalytics = dynamic(
  () => import('@/components/ai/PredictiveAnalytics').then(mod => ({ default: mod.PredictiveAnalytics })),
  { ssr: false, loading: () => null }
)
const HealthMonitoring = dynamic(
  () => import('@/components/ai/HealthMonitoring').then(mod => ({ default: mod.HealthMonitoring })),
  { ssr: false, loading: () => null }
)
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
  completedTasks?: number
  totalTasks?: number
  totalLeads?: number
  convertedLeads?: number
  contactsCreatedThisMonth?: number
  activeCustomers?: number
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

// PayAid Brand Colors for charts
const PURPLE_PRIMARY = '#53328A' // PayAid Purple - Primary brand color
const GOLD_ACCENT = '#F5C700' // PayAid Gold - Accent brand color
const SUCCESS = '#059669' // Success (Emerald)
const WARNING = '#D97706' // Warning (Amber)
const ERROR = '#DC2626' // Error (Red)
const INFO = '#0284C7' // Info (Blue)
const CHART_COLORS = [PURPLE_PRIMARY, GOLD_ACCENT, SUCCESS, INFO, WARNING, '#8B5CF6']

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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  // Profile menu and news handled by ModuleTopBar in layout
  const [isDark, setIsDark] = useState(false)
  
  // Refs to prevent duplicate API calls
  const fetchingStatsRef = useRef(false)
  const fetchingActivityRef = useRef(false)
  const fetchingTasksViewRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasCheckedDataRef = useRef(false) // Track if we've checked for demo data
  const hasTriggeredEnsureDemoRef = useRef(false)

  // When dashboard loads with no deals, ensure demo data once so demos are never empty
  useEffect(() => {
    if (!tenantId || !token || !stats || hasTriggeredEnsureDemoRef.current) return
    const pipelineTotal = (stats.pipelineByStage || []).reduce((s: number, p: any) => s + (Number(p?.count) || 0), 0)
    const hasDeals = (stats.dealsCreatedThisMonth || 0) + (stats.dealsClosingThisMonth || 0) + pipelineTotal > 0
    if (hasDeals) return
    hasTriggeredEnsureDemoRef.current = true
    ;(async () => {
      try {
        const res = await fetch(
          `/api/admin/ensure-demo-data?tenantId=${encodeURIComponent(tenantId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (res.ok) {
          const json = await res.json()
          if (json.created?.deals > 0 || json.created?.tasks > 0) {
            if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
              fetchDashboardStats(abortControllerRef.current.signal)
            }
          }
        }
      } catch (_) {}
    })()
  }, [tenantId, token, stats])

  // NO REDIRECT LOGIC - If tenantId is in URL params, we're good
  // The entry point (/crm) handles redirecting to the correct URL
  // This page should just render if tenantId is in the URL

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

  // Check if demo data exists and seed if needed (only once) - Run in background, don't block UI
  useEffect(() => {
    if (!tenantId || !token || hasCheckedDataRef.current) return
    
    hasCheckedDataRef.current = true // Mark as checked to prevent multiple checks
    
    // Run in background after initial render - don't block UI
    const checkAndSeedData = async () => {
      try {
        // First, check if a seed is already running
        try {
          const seedStatusResponse = await fetch(`/api/admin/seed-demo-data?checkStatus=true&tenantId=${tenantId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          })
          if (seedStatusResponse.ok) {
            const seedStatus = await seedStatusResponse.json()
            if (seedStatus.running) {
              const elapsedMinutes = Math.floor((seedStatus.elapsed || 0) / 60000)
              console.log(`[CRM_DASHBOARD] Seed already running (${elapsedMinutes} minutes ago). Skipping new seed trigger.`)
              // Schedule a refresh after seed completes
              setTimeout(() => {
                if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                  console.log('[CRM_DASHBOARD] Refreshing stats after seed completes...')
                  fetchDashboardStats(abortControllerRef.current.signal)
                }
              }, 30000) // Wait 30 seconds for seed to complete (optimized from 2 minutes)
              return // Don't trigger another seed
            }
          }
        } catch (statusError) {
          // If status check fails, continue with data check
          console.warn('[CRM_DASHBOARD] Could not check seed status:', statusError)
        }
        
        // Check if data exists (pass tenantId so we check the tenant we're viewing)
        const checkResponse = await fetch(`/api/admin/check-dashboard-data${tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ''}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        
        if (checkResponse.ok) {
          const checkData = await checkResponse.json()
          
          // If no data, seed it automatically in background
          if (!checkData.hasData) {
            console.log('[CRM_DASHBOARD] No data found, seeding comprehensive demo data in background...')
            try {
              // Use background mode and comprehensive seed to avoid timeout and get full data
              fetch(`/api/admin/seed-demo-data?background=true&comprehensive=true&tenantId=${encodeURIComponent(tenantId)}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
              }).then(seedResponse => {
                if (seedResponse.ok) {
                  seedResponse.json().then(data => {
                    console.log('[CRM_DASHBOARD] Comprehensive seed started in background:', data)
                    // Check if seed was already running
                    if (data.alreadyRunning) {
                      console.log(`[CRM_DASHBOARD] Seed already in progress (${data.elapsedSeconds}s). Waiting for completion...`)
                    }
                    // Poll for seed completion and reload stats when done
                    const pollSeedStatus = async (attempts = 0, maxAttempts = 12) => {
                      if (attempts >= maxAttempts) {
                        console.log('[CRM_DASHBOARD] Max polling attempts reached, refreshing stats anyway...')
                        if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                          fetchDashboardStats(abortControllerRef.current.signal)
                        }
                        return
                      }
                      
                      try {
                        const statusResponse = await fetch(`/api/admin/seed-demo-data?checkStatus=true&tenantId=${tenantId}`, {
                          headers: { 'Authorization': `Bearer ${token}` },
                        })
                        
                        if (statusResponse.ok) {
                          const statusData = await statusResponse.json()
                          
                          if (!statusData.running) {
                            // Seed completed, refresh stats
                            console.log('[CRM_DASHBOARD] Seed completed, refreshing stats...')
                            if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                              fetchDashboardStats(abortControllerRef.current.signal)
                              
                              // After fetching stats, check if we still have zeros and ensure current month data
                              setTimeout(async () => {
                                try {
                                  const statsResponse = await fetch(`/api/crm/dashboard/stats?period=month${tenantId ? `&tenantId=${encodeURIComponent(tenantId)}` : ''}`, {
                                    headers: { 'Authorization': `Bearer ${token}` },
                                  })
                                  if (statsResponse.ok) {
                                    const statsData = await statsResponse.json()
                                    if (statsData.dealsCreatedThisMonth === 0 && statsData.totalLeads === 0) {
                                      console.log('[CRM_DASHBOARD] Still showing zeros, ensuring current month data...')
                                      try {
                                        const ensureResponse = await fetch(`/api/admin/seed-demo-data?ensureCurrentMonth=true&tenantId=${tenantId}`, {
                                          headers: { 'Authorization': `Bearer ${token}` },
                                        })
                                        if (ensureResponse.ok) {
                                          const ensureData = await ensureResponse.json()
                                          console.log('[CRM_DASHBOARD] ensureCurrentMonthData response:', ensureData)
                                          if (ensureData.currentMonth?.contacts > 0 || ensureData.currentMonth?.deals > 0) {
                                            console.log('[CRM_DASHBOARD] Current month data created successfully. Refreshing stats...')
                                            // Wait a moment then refresh again
                                            setTimeout(() => {
                                              if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                                                fetchDashboardStats(abortControllerRef.current.signal)
                                              }
                                            }, 2000)
                                          } else {
                                            console.warn('[CRM_DASHBOARD] ensureCurrentMonthData completed but no data found:', ensureData)
                                          }
                                        } else if (ensureResponse.status === 202) {
                                          // Seed still running, wait and retry
                                          const errorData = await ensureResponse.json().catch(() => ({}))
                                          console.log('[CRM_DASHBOARD] Seed still running, will retry ensureCurrentMonthData later:', errorData)
                                          // Retry after 10 seconds
                                          setTimeout(() => {
                                            if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                                              fetchDashboardStats(abortControllerRef.current.signal)
                                            }
                                          }, 10000)
                                        } else {
                                          const errorData = await ensureResponse.json().catch(() => ({}))
                                          console.error('[CRM_DASHBOARD] Failed to ensure current month data:', ensureResponse.status, errorData)
                                        }
                                      } catch (ensureError) {
                                        console.error('[CRM_DASHBOARD] Error calling ensureCurrentMonthData:', ensureError)
                                      }
                                    }
                                  }
                                } catch (err) {
                                  console.error('[CRM_DASHBOARD] Error checking stats after seed:', err)
                                }
                              }, 3000) // Wait 3 seconds for stats to load
                            }
                          } else {
                            // Still running, check again in 5 seconds
                            console.log(`[CRM_DASHBOARD] Seed still running (${statusData.elapsedSeconds}s), checking again in 5s...`)
                            setTimeout(() => pollSeedStatus(attempts + 1, maxAttempts), 5000)
                          }
                        } else {
                          // If status check fails, wait and try refreshing anyway
                          setTimeout(() => {
                            if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                              fetchDashboardStats(abortControllerRef.current.signal)
                            }
                          }, 10000)
                        }
                      } catch (pollError) {
                        console.error('[CRM_DASHBOARD] Error polling seed status:', pollError)
                        // On error, wait a bit and refresh anyway
                        setTimeout(() => {
                          if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                            fetchDashboardStats(abortControllerRef.current.signal)
                          }
                        }, 10000)
                      }
                    }
                    
                    // Start polling after initial delay (seed needs at least 10 seconds)
                    setTimeout(() => pollSeedStatus(), 10000)
                  })
                } else {
                  seedResponse.json().then(errorData => {
                    console.error('[CRM_DASHBOARD] Seed failed:', errorData)
                    // If seed is already running, that's okay - just wait
                    if (errorData.message?.includes('already in progress')) {
                      console.log('[CRM_DASHBOARD] Seed already running, will wait for completion')
                      setTimeout(() => {
                        if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                          fetchDashboardStats(abortControllerRef.current.signal)
                        }
                      }, 30000) // Wait 30 seconds (optimized from 2 minutes)
                    }
                  }).catch(() => {
                    console.error('[CRM_DASHBOARD] Seed failed with status:', seedResponse.status)
                  })
                }
              }).catch(seedError => {
                console.error('[CRM_DASHBOARD] Failed to seed demo data:', seedError)
              })
            } catch (seedError) {
              console.error('[CRM_DASHBOARD] Failed to seed demo data:', seedError)
            }
          }
        }
      } catch (checkError) {
        console.error('[CRM_DASHBOARD] Failed to check dashboard data:', checkError)
      }
    }
    
    // Run after initial render - don't block
    const timeoutId = setTimeout(checkAndSeedData, 0)
    return () => clearTimeout(timeoutId)
  }, [tenantId, token]) // Only run when tenantId or token changes

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

  // Keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        setCommandPaletteOpen(true)
      }
      // Close with Escape
      if (event.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen])

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
    
    // Optimized loading: Load stats immediately, then load view-specific data in parallel
    const loadData = async () => {
      // Prevent duplicate calls
      if (fetchingStatsRef.current) {
        return
      }
      
      try {
        fetchingStatsRef.current = true
        
        // Load stats first (most important) - this will show the main dashboard immediately
        await fetchDashboardStats(signal)
        
        // Load view-specific data in parallel (non-blocking) after stats are loaded
        if (!signal.aborted) {
          // No delay - load immediately in parallel
          if (currentView === 'tasks') {
            fetchTasksViewData().catch(err => {
              if (err?.name !== 'AbortError') {
                console.error('Error loading tasks view:', err)
              }
            })
          } else if (currentView === 'activity') {
            fetchActivityFeed(signal).catch(err => {
              if (err?.name !== 'AbortError') {
                console.error('Error loading activity feed:', err)
              }
            })
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
    // Prevent duplicate calls
    if (fetchingTasksViewRef.current) {
      return
    }
    
    try {
      fetchingTasksViewRef.current = true
      const token = useAuthStore.getState().token
      if (!token) {
        fetchingTasksViewRef.current = false
        return
      }

      const response = await fetch('/api/crm/dashboard/tasks-view', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tasks view data')
      }

      const data = await response.json()
      // Ensure all array properties exist to prevent .map() errors
      setTasksViewData({
        myOpenActivitiesToday: Array.isArray(data.myOpenActivitiesToday) ? data.myOpenActivitiesToday : [],
        myOpenTasks: Array.isArray(data.myOpenTasks) ? data.myOpenTasks : [],
        myMeetingsToday: Array.isArray(data.myMeetingsToday) ? data.myMeetingsToday : [],
        myLeads: Array.isArray(data.myLeads) ? data.myLeads : [],
        myPipelineDealsByStage: Array.isArray(data.myPipelineDealsByStage) ? data.myPipelineDealsByStage : [],
        myDealsClosingThisMonth: Array.isArray(data.myDealsClosingThisMonth) ? data.myDealsClosingThisMonth : [],
      })
    } catch (err) {
      console.error('Error fetching tasks view:', err)
      // Set empty data on error to prevent undefined errors
      setTasksViewData({
        myOpenActivitiesToday: [],
        myOpenTasks: [],
        myMeetingsToday: [],
        myLeads: [],
        myPipelineDealsByStage: [],
        myDealsClosingThisMonth: [],
      })
    } finally {
      fetchingTasksViewRef.current = false
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
        // CRITICAL: Ensure activities is always an array to prevent .map() errors
        const activities = data?.activities
        if (Array.isArray(activities)) {
          setActivityFeedData(activities)
        } else {
          console.warn('[CRM_DASHBOARD] activities is not an array:', typeof activities, activities)
          setActivityFeedData([])
        }
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
    const RETRY_DELAY = 1000 // 1 second (optimized for faster retries)
    
    try {
      setLoading(true)
      setError(null)
      const token = useAuthStore.getState().token
      
      if (!token) {
        console.error('No authentication token found')
        setLoading(false)
        return
      }

      console.log('[CRM_DASHBOARD] Fetching stats from API...')
      const statsUrl = `/api/crm/dashboard/stats?period=${timePeriod}${tenantId ? `&tenantId=${encodeURIComponent(tenantId)}` : ''}`
      const response = await fetch(statsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal, // Add abort signal
      })

      console.log('[CRM_DASHBOARD] Stats API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

      // Check if request was aborted
      if (signal?.aborted) {
        return
      }

      // Check content type before parsing
      const contentType = response.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')

      if (response.ok) {
        // Check if response has content before parsing
        const text = await response.text()
        if (!text || text.trim() === '') {
          console.error('[CRM_DASHBOARD] Empty response from stats API')
          throw new Error('Empty response from server')
        }
        
        try {
          const data = JSON.parse(text)
          console.log('[CRM_DASHBOARD] Stats data received:', {
            dealsCreatedThisMonth: data.dealsCreatedThisMonth,
            revenueThisMonth: data.revenueThisMonth,
            totalLeads: data.totalLeads,
            convertedLeads: data.convertedLeads,
            topLeadSourcesCount: data.topLeadSources?.length || 0,
            pipelineByStageCount: data.pipelineByStage?.length || 0,
          })
          // Ensure all array properties exist and are properly normalized to prevent .map() errors
          const normalizeArray = <T,>(arr: any, defaultValue: T[] = []): T[] => {
            // Multiple defensive checks
            if (arr === null || arr === undefined) return defaultValue
            if (!Array.isArray(arr)) {
              console.warn('[CRM_DASHBOARD] normalizeArray received non-array:', typeof arr, arr)
              return defaultValue
            }
            try {
              // Safely map and filter
              const result = arr
                .filter((item: any) => item !== null && item !== undefined)
                .map((item: any) => item)
              
              // Ensure result is still an array
              if (!Array.isArray(result)) {
                console.warn('[CRM_DASHBOARD] normalizeArray result is not an array:', typeof result)
                return defaultValue
              }
              
              return result as T[]
            } catch (err) {
              console.error('[CRM_DASHBOARD] Error in normalizeArray:', err)
              return defaultValue
            }
          }
          
          setStats({
            dealsCreatedThisMonth: Number(data.dealsCreatedThisMonth || 0),
            revenueThisMonth: Number(data.revenueThisMonth || 0),
            dealsClosingThisMonth: Number(data.dealsClosingThisMonth || 0),
            overdueTasks: Number(data.overdueTasks || 0),
            completedTasks: Number(data.completedTasks || 0),
            totalTasks: Number(data.totalTasks || 0),
            totalLeads: Number(data.totalLeads || 0),
            convertedLeads: Number(data.convertedLeads || 0),
            contactsCreatedThisMonth: Number(data.contactsCreatedThisMonth || 0),
            activeCustomers: Number(data.activeCustomers || data.convertedLeads || 0),
            quarterlyPerformance: normalizeArray(data.quarterlyPerformance, []),
            pipelineByStage: normalizeArray(data.pipelineByStage, []),
            monthlyLeadCreation: normalizeArray(data.monthlyLeadCreation, []),
            topLeadSources: normalizeArray(data.topLeadSources, []),
          })
          setLoading(false)
        } catch (parseError) {
          console.error('[CRM_DASHBOARD] Failed to parse JSON response:', parseError, { text: text.substring(0, 200) })
          throw new Error('Invalid response format from server')
        }
      } else if (response.status === 429 || response.status === 503) {
        // Handle rate limit (too many concurrent requests) or service unavailable
        let errorData = {}
        if (isJson) {
          try {
            const text = await response.text()
            if (text && text.trim()) {
              errorData = JSON.parse(text)
            }
          } catch (parseError) {
            console.warn('[CRM_DASHBOARD] Failed to parse error response:', parseError)
          }
        }
        const retryAfter = (errorData as any).retryAfter || 2
        const errorMessage = (errorData as any).message || (errorData as any).error || 'Service temporarily unavailable'
        
        // Check if request was aborted before retrying
        if (signal?.aborted) {
          return
        }
        
        if (retryCount < MAX_RETRIES) {
          const delay = retryAfter * 1000 * (retryCount + 1) // Exponential backoff
          setError(`${errorMessage}. Retrying in ${(delay/1000).toFixed(1)} seconds... (${retryCount + 1}/${MAX_RETRIES})`)
          // Retry after delay
          await new Promise(resolve => setTimeout(resolve, delay))
          
          // Check again if aborted before retrying
          if (signal?.aborted) {
            return
          }
          
          return fetchDashboardStats(signal, retryCount + 1)
        } else {
          setError(errorMessage || 'Too many concurrent requests. Please wait a moment and refresh the page.')
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
      } else if (response.status === 503) {
        // Handle service unavailable (pool exhaustion)
        let errorData = {}
        if (isJson) {
          try {
            const text = await response.text()
            if (text && text.trim()) {
              errorData = JSON.parse(text)
            }
          } catch (parseError) {
            console.warn('[CRM_DASHBOARD] Failed to parse 503 error response:', parseError)
          }
        }
        const retryAfter = (errorData as any).retryAfter || 5
        
        // Check if request was aborted before retrying
        if (signal?.aborted) {
          return
        }
        
        if (retryCount < MAX_RETRIES) {
          const delay = retryAfter * 1000 * (retryCount + 1) // Exponential backoff
          const errorMessage = (errorData as any).message || (errorData as any).error || 'Database busy'
          setError(`${errorMessage}. Retrying in ${(delay/1000).toFixed(1)} seconds... (${retryCount + 1}/${MAX_RETRIES})`)
          // Retry after delay
          await new Promise(resolve => setTimeout(resolve, delay))
          
          // Check again if aborted before retrying
          if (signal?.aborted) {
            return
          }
          
          return fetchDashboardStats(signal, retryCount + 1)
        } else {
          const errorMessage = (errorData as any).message || (errorData as any).error || 'Database temporarily unavailable'
          setError(errorMessage + '. Please refresh the page in a moment.')
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
        // Handle other error statuses
        let errorMessage = `Failed to fetch dashboard stats: ${response.status} ${response.statusText}`
        
        if (isJson) {
          try {
            const text = await response.text()
            if (text && text.trim()) {
              const errorData = JSON.parse(text)
              errorMessage = errorData.message || errorData.error || errorMessage
            }
          } catch (parseError) {
            console.warn('[CRM_DASHBOARD] Failed to parse error response:', parseError)
          }
        }
        
        // If 401 Unauthorized, suggest re-login
        if (response.status === 401) {
          errorMessage = 'Your session has expired. Please log out and log back in.'
          // Don't throw - let the error handler show a user-friendly message
        }
        
        throw new Error(errorMessage)
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

  // CRITICAL: If we have an error and no stats, show error but don't crash
  if (error && !stats) {
    return (
      <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Ensure stats is never null - use default values if missing
  // CRITICAL: Always ensure all array properties are arrays, never null/undefined
  const safeStats: DashboardStats = (() => {
    if (!stats) {
      return {
        dealsCreatedThisMonth: 0,
        revenueThisMonth: 0,
        dealsClosingThisMonth: 0,
        overdueTasks: 0,
        completedTasks: 0,
        totalTasks: 0,
        totalLeads: 0,
        convertedLeads: 0,
        contactsCreatedThisMonth: 0,
        activeCustomers: 0,
        quarterlyPerformance: [],
        pipelineByStage: [],
        monthlyLeadCreation: [],
        topLeadSources: [],
      }
    }
    
    // Normalize all array properties to ensure they're always arrays
    return {
      dealsCreatedThisMonth: Number(stats.dealsCreatedThisMonth || 0),
      revenueThisMonth: Number(stats.revenueThisMonth || 0),
      dealsClosingThisMonth: Number(stats.dealsClosingThisMonth || 0),
      overdueTasks: Number(stats.overdueTasks || 0),
      completedTasks: Number(stats.completedTasks || 0),
      totalTasks: Number(stats.totalTasks || 0),
      totalLeads: Number(stats.totalLeads || 0),
      convertedLeads: Number(stats.convertedLeads || 0),
      contactsCreatedThisMonth: Number(stats.contactsCreatedThisMonth || stats.totalLeads || 0),
      activeCustomers: Number(stats.activeCustomers || stats.convertedLeads || 0),
      quarterlyPerformance: Array.isArray(stats.quarterlyPerformance) ? stats.quarterlyPerformance : [],
      pipelineByStage: Array.isArray(stats.pipelineByStage) ? stats.pipelineByStage : [],
      monthlyLeadCreation: Array.isArray(stats.monthlyLeadCreation) ? stats.monthlyLeadCreation : [],
      topLeadSources: Array.isArray(stats.topLeadSources) ? stats.topLeadSources : [],
    }
  })()

  // Prepare chart data - ensure arrays before mapping with extra safety
  // CRITICAL: Always return an array, never null/undefined
  const pipelineChartData = (() => {
    try {
      if (!safeStats || !safeStats.pipelineByStage) return []
      const data = safeStats.pipelineByStage
      if (!Array.isArray(data)) {
        console.warn('[CRM_DASHBOARD] pipelineByStage is not an array:', typeof data, data)
        return []
      }
      const result = data.map((item, idx) => ({
        name: item?.stage ? String(item.stage).charAt(0).toUpperCase() + String(item.stage).slice(1) : `Stage ${idx + 1}`,
        value: Number(item?.count || 0),
        fill: CHART_COLORS[idx % CHART_COLORS.length]
      }))
      return Array.isArray(result) ? result : []
    } catch (err) {
      console.error('[CRM_DASHBOARD] Error preparing pipelineChartData:', err)
      return []
    }
  })()

  const monthlyLeadData = (() => {
    try {
      if (!safeStats || !safeStats.monthlyLeadCreation) return []
      const data = safeStats.monthlyLeadCreation
      if (!Array.isArray(data)) {
        console.warn('[CRM_DASHBOARD] monthlyLeadCreation is not an array:', typeof data, data)
        return []
      }
      const result = data.map(item => ({
        month: String(item?.month || ''),
        leads: Number(item?.count || 0)
      }))
      return Array.isArray(result) ? result : []
    } catch (err) {
      console.error('[CRM_DASHBOARD] Error preparing monthlyLeadData:', err)
      return []
    }
  })()

  // Map quarterly performance data for the chart - use actual data from API
  const quarterlyRevenueData = (() => {
    try {
      if (!safeStats || !safeStats.quarterlyPerformance) return []
      const data = safeStats.quarterlyPerformance
      if (!Array.isArray(data)) {
        console.warn('[CRM_DASHBOARD] quarterlyPerformance is not an array:', typeof data, data)
        return []
      }
      const result = data.map(q => ({
        quarter: String(q?.quarter || ''),
        revenue: Number(q?.revenue ?? 0) || 0,
        deals: Number(q?.dealsWon ?? 0) || 0
      }))
      return Array.isArray(result) ? result : []
    } catch (err) {
      console.error('[CRM_DASHBOARD] Error preparing quarterlyRevenueData:', err)
      return []
    }
  })()

  const topLeadSourcesData = (() => {
    try {
      // CRITICAL: Ensure safeStats exists before accessing properties
      if (!safeStats) {
        console.warn('[CRM_DASHBOARD] safeStats is null/undefined in topLeadSourcesData')
        return []
      }
      const data = safeStats.topLeadSources
      
      // Multiple defensive checks
      if (!data) {
        console.warn('[CRM_DASHBOARD] topLeadSources is null/undefined')
        return []
      }
      
      if (!Array.isArray(data)) {
        console.warn('[CRM_DASHBOARD] topLeadSources is not an array:', typeof data, data)
        return []
      }
      
      // Ensure data is actually an array and has length
      if (data.length === 0) {
        return []
      }
      
      // Safely map with additional validation - wrap each step in validation
      let filtered: any[] = []
      try {
        // Step 1: Filter out null/undefined items
        if (Array.isArray(data)) {
          filtered = data.filter((item: any) => {
            if (!item || typeof item !== 'object') return false
            return true
          })
        } else {
          console.warn('[CRM_DASHBOARD] Data is not an array before filter:', typeof data)
          return []
        }
      } catch (filterErr) {
        console.error('[CRM_DASHBOARD] Error filtering topLeadSources:', filterErr)
        return []
      }
      
      // Step 2: Map to normalized format
      let mapped: any[] = []
      try {
        if (Array.isArray(filtered)) {
          mapped = filtered.map((item: any) => {
            // Ensure each item has required properties
            return {
              name: String(item?.name || 'Unknown'),
              leadsCount: Number(item?.leadsCount || 0),
              conversionsCount: Number(item?.conversionsCount || 0),
              totalValue: Number(item?.totalValue || 0),
              conversionRate: Number(item?.conversionRate || 0),
            }
          })
        } else {
          console.warn('[CRM_DASHBOARD] Filtered result is not an array:', typeof filtered)
          return []
        }
      } catch (mapErr) {
        console.error('[CRM_DASHBOARD] Error mapping topLeadSources:', mapErr)
        return []
      }
      
      // Step 3: Final filter
      let finalResult: any[] = []
      try {
        if (Array.isArray(mapped)) {
          finalResult = mapped.filter((item: any) => item.name !== 'Unknown' || item.leadsCount > 0)
        } else {
          console.warn('[CRM_DASHBOARD] Mapped result is not an array:', typeof mapped)
          return []
        }
      } catch (finalFilterErr) {
        console.error('[CRM_DASHBOARD] Error in final filter:', finalFilterErr)
        return []
      }
      
      // Final check - ensure result is an array
      if (!Array.isArray(finalResult)) {
        console.warn('[CRM_DASHBOARD] Final result is not an array:', typeof finalResult)
        return []
      }
      
      return finalResult
    } catch (err) {
      console.error('[CRM_DASHBOARD] Error preparing topLeadSourcesData:', err)
      return []
    }
  })()

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 relative transition-colors min-h-screen">
      {/* Welcome Banner - Enhanced - PayAid Brand Colors */}
      <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 px-6 py-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 text-white">
              <span>Welcome back, {user?.name || 'User'}!</span>
            </h1>
            {tenant && (
              <p className="text-white flex items-center gap-2 text-lg opacity-90">
                <Building2 className="w-5 h-5" />
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
              className="text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white font-medium cursor-pointer"
            >
              <option value="month" className="text-gray-900 bg-white">This Month</option>
              <option value="quarter" className="text-gray-900 bg-white">This Quarter</option>
              <option value="financial-year" className="text-gray-900 bg-white">This Financial Year</option>
              <option value="year" className="text-gray-900 bg-white">This Year</option>
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
              className="text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white font-medium cursor-pointer"
            >
              <option value="manager" className="text-gray-900 bg-white">Manager&apos;s Home</option>
              <option value="tasks" className="text-gray-900 bg-white">Tasks View</option>
              <option value="activity" className="text-gray-900 bg-white">Activity Feed</option>
              <option value="pipeline" className="text-gray-900 bg-white">Pipeline View</option>
              <option value="sales" className="text-gray-900 bg-white">Sales Performance</option>
              <option value="custom" className="text-gray-900 bg-white">Custom Dashboard</option>
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
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">My Open Activities for Today</CardTitle>
                <CardDescription className="text-sm">Tasks and activities due today</CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(tasksViewData?.myOpenActivitiesToday) && tasksViewData.myOpenActivitiesToday.length > 0 ? (
                  <div className="space-y-2">
                    {(Array.isArray(tasksViewData.myOpenActivitiesToday) ? tasksViewData.myOpenActivitiesToday : []).map((activity) => (
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
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">My Open Tasks</CardTitle>
                <CardDescription className="text-sm">All pending and in-progress tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(tasksViewData?.myOpenTasks) && tasksViewData.myOpenTasks.length > 0 ? (
                  <div className="space-y-2">
                    {(Array.isArray(tasksViewData.myOpenTasks) ? tasksViewData.myOpenTasks : []).map((task) => (
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
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">My Meetings for Today</CardTitle>
                <CardDescription className="text-sm">Scheduled meetings today</CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(tasksViewData?.myMeetingsToday) && tasksViewData.myMeetingsToday.length > 0 ? (
                  <div className="space-y-2">
                    {(Array.isArray(tasksViewData.myMeetingsToday) ? tasksViewData.myMeetingsToday : []).map((meeting) => (
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
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">My Leads</CardTitle>
                <CardDescription className="text-sm">Recent leads assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(tasksViewData?.myLeads) && tasksViewData.myLeads.length > 0 ? (
                  <div className="space-y-2">
                    {(Array.isArray(tasksViewData.myLeads) ? tasksViewData.myLeads : []).map((lead) => {
                      const contactScore = calculateContactScore(lead)
                      const displayScore = lead.leadScore || contactScore
                      return (
                        <div key={lead.id} className="p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="font-medium text-gray-900 dark:text-gray-100">{lead.name || 'Unnamed Lead'}</p>
                                <AIScoreBadge score={displayScore} type="lead" size="sm" />
                              </div>
                              {lead.company && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {typeof lead.company === 'string' ? lead.company : lead.company.name || 'No company'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">No leads assigned</p>
                )}
              </CardContent>
            </Card>

            {/* My Pipeline Deals By Stage */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">My Pipeline Deals By Stage</CardTitle>
                <CardDescription className="text-sm">Deals distribution across pipeline stages</CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(tasksViewData?.myPipelineDealsByStage) && tasksViewData.myPipelineDealsByStage.length > 0 ? (
                  <div className="space-y-2">
                    {(Array.isArray(tasksViewData.myPipelineDealsByStage) ? tasksViewData.myPipelineDealsByStage : []).map((stage) => (
                      <div key={stage.stage} className="p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{stage.stage}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{stage.count || 0} deals</p>
                          </div>
                          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {formatINRForDisplay(stage.totalValue || 0)}
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
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">My Deals Closing This Month</CardTitle>
                <CardDescription className="text-sm">Deals expected to close this month</CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(tasksViewData?.myDealsClosingThisMonth) && tasksViewData.myDealsClosingThisMonth.length > 0 ? (
                  <div className="space-y-2">
                    {(Array.isArray(tasksViewData.myDealsClosingThisMonth) ? tasksViewData.myDealsClosingThisMonth : []).map((deal) => {
                      const dealScore = calculateDealScore(deal)
                      return (
                        <div key={deal.id} className="p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="font-medium text-gray-900 dark:text-gray-100">{deal.name}</p>
                                <AIScoreBadge score={dealScore} type="deal" size="sm" />
                              </div>
                              {deal.contact && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {deal.contact.name || deal.contact.email || 'Contact'}
                                  {deal.contact.company && typeof deal.contact.company === 'string' && ` - ${deal.contact.company}`}
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-semibold text-blue-600 dark:text-blue-400">{formatINRForDisplay(deal.value || 0)}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('en-IN') : 'No date'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
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

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
                <CardDescription className="text-sm">All activities sorted by most recent</CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(activityFeedData) && activityFeedData.length > 0 ? (
                  <div className="space-y-4">
                    {(Array.isArray(activityFeedData) ? activityFeedData : []).map((activity, index) => (
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
                                  activity.type === 'task' ? 'bg-info-light text-info border border-info/30' :
                                  activity.type === 'call' ? 'bg-emerald-success/10 text-emerald-success border border-emerald-success/20' :
                                  activity.type === 'email' ? 'bg-purple-100 text-purple-700 border border-purple-300' :
                                  activity.type === 'meeting' ? 'bg-amber-alert/10 text-amber-alert border border-amber-alert/20' :
                                  activity.type === 'deal' ? 'bg-gold-100 text-gold-700 border border-gold-300' :
                                  'bg-gray-100 text-gray-700 border border-gray-300'
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
                                    <span>Value: {formatINRForDisplay(activity.metadata.value)}</span>
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
        {/* PIXEL-PERFECT 12-COLUMN CSS GRID LAYOUT */}
        <div className="dashboard-container">
          <div className="dashboard-grid">
          
          {/* Band 1: AI Command Center - Full Width (Row 1) */}
          {stats && safeStats && (
            <motion.div 
              className="ai-command-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <AICommandCenter tenantId={tenantId} stats={safeStats} timePeriod={timePeriod} userName={user?.name || undefined} />
            </motion.div>
          )}

          {/* Band 2: Row 1 - Stat Cards (6 identical cards, each spans 2 columns) */}
          {/* Stat Card 1: Deals Created */}
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Link href={tenantId ? `/crm/${tenantId}/Deals?category=created&timePeriod=${timePeriod}` : '#'}>
              <Card className="stat-card-uniform" style={{ height: '100%', padding: 0, borderRadius: 0, border: 0, boxShadow: 'none', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
                <div className="flex flex-row items-center justify-between mb-1" style={{ minHeight: '32px' }}>
                  <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider" style={{ lineHeight: '1.2', margin: 0 }}>Deals Created</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold stat-card-gradient-text dark:text-purple-300 mb-0.5" style={{ lineHeight: '1.2' }}>
                  {safeStats.dealsCreatedThisMonth || 0}
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium mb-0.5" style={{ lineHeight: '1.2' }}>
                  <ArrowUpRight className="w-3 h-3" />
                  <span>vs last period +12%</span>
                </p>
                {safeStats.dealsCreatedThisMonth > 0 && (
                  <div className="flex items-center gap-1" style={{ marginTop: 'auto' }}>
                    <span className="status-badge on-track">On track</span>
                  </div>
                )}
              </Card>
            </Link>
          </motion.div>

          {/* Stat Card 2: Revenue */}
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Link href={tenantId ? `/crm/${tenantId}/Deals?category=won&timePeriod=${timePeriod}` : '#'}>
              <Card className="stat-card-uniform" style={{ height: '100%', padding: 0, borderRadius: 0, border: 0, boxShadow: 'none', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
                <div className="flex flex-row items-center justify-between mb-1" style={{ minHeight: '32px' }}>
                  <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider" style={{ lineHeight: '1.2', margin: 0 }}>Revenue</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IndianRupee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="text-xl font-bold stat-card-gradient-text dark:text-purple-300 mb-0.5" style={{ lineHeight: '1.2' }}>
                  {safeStats.revenueThisMonth ? formatINRForDisplay(safeStats.revenueThisMonth) : '₹0'}
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium mb-0.5" style={{ lineHeight: '1.2' }}>
                  <ArrowUpRight className="w-3 h-3" />
                  <span>vs last period +18%</span>
                </p>
                {safeStats.revenueThisMonth > 0 && (
                  <div className="flex items-center gap-1" style={{ marginTop: 'auto' }}>
                    <span className="status-badge ahead">Ahead</span>
                  </div>
                )}
              </Card>
            </Link>
          </motion.div>

          {/* Stat Card 3: Deals Closing */}
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Link href={tenantId ? `/crm/${tenantId}/Deals?category=closing&timePeriod=${timePeriod}` : '#'}>
              <Card className="stat-card-uniform" style={{ height: '100%', padding: 0, borderRadius: 0, border: 0, boxShadow: 'none', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
                <div className="flex flex-row items-center justify-between mb-1" style={{ minHeight: '32px' }}>
                  <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider" style={{ lineHeight: '1.2', margin: 0 }}>Deals Closing</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold stat-card-gradient-text dark:text-purple-300 mb-0.5" style={{ lineHeight: '1.2' }}>
                  {safeStats.dealsClosingThisMonth || 0}
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium mb-0.5" style={{ lineHeight: '1.2' }}>
                  <ArrowUpRight className="w-3 h-3" />
                  <span>vs last period +8%</span>
                </p>
                {safeStats.dealsClosingThisMonth > 0 && (
                  <div className="flex items-center gap-1" style={{ marginTop: 'auto' }}>
                    <span className="status-badge on-track">High win prob</span>
                  </div>
                )}
              </Card>
            </Link>
          </motion.div>

          {/* Stat Card 4: Overdue Tasks */}
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Link href={tenantId ? `/crm/${tenantId}/Tasks?filter=overdue` : '#'}>
              <Card className="stat-card-uniform" style={{ height: '100%', padding: 0, borderRadius: 0, border: 0, boxShadow: 'none', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
                <div className="flex flex-row items-center justify-between mb-1" style={{ minHeight: '32px' }}>
                  <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider" style={{ lineHeight: '1.2', margin: 0 }}>Overdue Tasks</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-0.5" style={{ lineHeight: '1.2' }}>
                  {safeStats.overdueTasks || 0}
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 font-medium mb-0.5" style={{ lineHeight: '1.2' }}>
                  <ArrowDownRight className="w-3 h-3" />
                  <span>vs last period +5%</span>
                </p>
                {safeStats.overdueTasks > 0 && (
                  <div className="flex items-center gap-1" style={{ marginTop: 'auto' }}>
                    <span className="status-badge critical">At risk</span>
                  </div>
                )}
              </Card>
            </Link>
          </motion.div>

          {/* Stat Card 5: New Contacts */}
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Link href={tenantId ? `/crm/${tenantId}/Contacts?filter=new` : '#'}>
              <Card className="stat-card-uniform" style={{ height: '100%', padding: 0, borderRadius: 0, border: 0, boxShadow: 'none', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
                <div className="flex flex-row items-center justify-between mb-1" style={{ minHeight: '32px' }}>
                  <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider" style={{ lineHeight: '1.2', margin: 0 }}>New Contacts</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold stat-card-gradient-text dark:text-purple-300 mb-0.5" style={{ lineHeight: '1.2' }}>
                  {safeStats.contactsCreatedThisMonth || safeStats.totalLeads || 0}
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium mb-0.5" style={{ lineHeight: '1.2' }}>
                  <ArrowUpRight className="w-3 h-3" />
                  <span>vs last period +15%</span>
                </p>
                {((safeStats.contactsCreatedThisMonth ?? 0) > 0) && (
                  <div className="flex items-center gap-1" style={{ marginTop: 'auto' }}>
                    <span className="status-badge ahead">Growing</span>
                  </div>
                )}
              </Card>
            </Link>
          </motion.div>

          {/* Stat Card 6: Pipeline Size */}
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Link href={tenantId ? `/crm/${tenantId}/Deals` : '#'}>
              <Card className="stat-card-uniform" style={{ height: '100%', padding: 0, borderRadius: 0, border: 0, boxShadow: 'none', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
                <div className="flex flex-row items-center justify-between mb-1" style={{ minHeight: '32px' }}>
                  <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider" style={{ lineHeight: '1.2', margin: 0 }}>Pipeline Size</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold stat-card-gradient-text dark:text-purple-300 mb-0.5" style={{ lineHeight: '1.2' }}>
                  {safeStats.pipelineByStage?.reduce((sum: number, stage: any) => sum + (stage.count || 0), 0) || 0}
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium mb-0.5" style={{ lineHeight: '1.2' }}>
                  <ArrowUpRight className="w-3 h-3" />
                  <span>Active deals</span>
                </p>
                {safeStats.pipelineByStage && safeStats.pipelineByStage.length > 0 && (
                  <div className="flex items-center gap-1" style={{ marginTop: 'auto' }}>
                    <span className="status-badge on-track">Healthy</span>
                  </div>
                )}
              </Card>
            </Link>
          </motion.div>

          {/* Band 2: Row 2 - Charts (3 charts, each spans 4 columns) */}
          {safeStats && (
            <>
            {/* Chart 1: Pipeline by Stage */}
            <motion.div 
              className="chart-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              whileHover={{ y: -2 }}
            >
              <Card className="border-0 rounded-xl" style={{ height: '100%', padding: 0, borderRadius: 0, background: 'transparent' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-purple-900">Pipeline by Stage</CardTitle>
                  <CardDescription className="text-sm">Distribution of deals across pipeline stages</CardDescription>
                </CardHeader>
                <CardContent style={{ height: 'calc(100% - 80px)', overflow: 'hidden', position: 'relative', padding: '16px 16px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {Array.isArray(pipelineChartData) && pipelineChartData.length > 0 ? (
                  <div style={{ width: '100%', height: '260px', minWidth: 0, minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={260}>
                    <PieChart>
                      <Pie
                        data={Array.isArray(pipelineChartData) ? pipelineChartData : []}
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
                        {Array.isArray(pipelineChartData) && pipelineChartData.length > 0 ? pipelineChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        )) : null}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [value, 'Deals']}
                        contentStyle={{
                          backgroundColor: isDark ? 'rgb(31, 41, 55)' : '#fff',
                          color: isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)',
                          border: `1px solid ${PURPLE_PRIMARY}`,
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                ) : (
                  <div className="flex items-center justify-center text-gray-500 dark:text-gray-400" style={{ height: '100%' }}>
                    <p>No pipeline data available</p>
                  </div>
                )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Chart 2: Monthly Lead Creation */}
            <motion.div 
              className="chart-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.45 }}
              whileHover={{ y: -2 }}
            >
              <Card className="border-0 rounded-xl" style={{ height: '100%', padding: 0, borderRadius: 0, background: 'transparent' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Monthly Lead Creation</CardTitle>
                  <CardDescription className="text-sm">Lead generation trend over time</CardDescription>
                </CardHeader>
                <CardContent style={{ height: 'calc(100% - 80px)', overflow: 'hidden', position: 'relative', padding: '16px 16px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {Array.isArray(monthlyLeadData) && monthlyLeadData.length > 0 ? (
                  <div style={{ width: '100%', height: '260px', minWidth: 0, minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={260}>
                    <AreaChart data={Array.isArray(monthlyLeadData) ? monthlyLeadData : []}>
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PURPLE_PRIMARY} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={PURPLE_PRIMARY} stopOpacity={0}/>
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
                          border: `1px solid ${PURPLE_PRIMARY}`,
                          borderRadius: '8px',
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="leads" 
                        stroke={PURPLE_PRIMARY} 
                        fillOpacity={1} 
                        fill="url(#colorLeads)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                ) : (
                  <div className="flex items-center justify-center text-gray-500 dark:text-gray-400" style={{ height: '100%' }}>
                    <p>No lead creation data available</p>
                  </div>
                )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Chart 3: TOP 10 Lead Sources */}
            <motion.div 
              className="chart-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              whileHover={{ y: -2 }}
            >
              <Card className="border-0 rounded-xl" style={{ height: '100%', padding: 0, borderRadius: 0, background: 'transparent' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-purple-900">TOP 10 Lead Sources</CardTitle>
                  <CardDescription className="text-sm">Best performing lead sources</CardDescription>
                </CardHeader>
                <CardContent style={{ height: 'calc(100% - 80px)', overflow: 'hidden', position: 'relative', padding: '16px' }}>
                {Array.isArray(topLeadSourcesData) && topLeadSourcesData.length > 0 ? (
                  <div style={{ width: '100%', height: '260px', minWidth: 0, minHeight: 260 }}>
                    <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={260}>
                    <BarChart 
                      data={Array.isArray(topLeadSourcesData) ? topLeadSourcesData.slice(0, 10) : []} 
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
                        width={120}
                        tick={{ fontSize: 10, fill: isDark ? '#D1D5DB' : '#666' }}
                        interval={0}
                        angle={0}
                        textAnchor="end"
                        dx={-5}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDark ? 'rgb(31, 41, 55)' : '#fff',
                          color: isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)',
                          border: `1px solid ${PURPLE_PRIMARY}`,
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
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
                                {Array.isArray(sortedPayload) && sortedPayload.length > 0 ? sortedPayload.map((entry: any, index: number) => {
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
                                    value = formatINRForDisplay(value)
                                  } else if (entry.dataKey === 'conversionRate') {
                                    label = 'Conversion Rate'
                                    value = `${value.toFixed(1)}%`
                                  }
                                  
                                  return (
                                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                                      <span className="font-medium">{label}:</span> {value}
                                    </p>
                                  )
                                }) : null}
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
                      <Bar dataKey="leadsCount" fill={PURPLE_PRIMARY} name="Leads" radius={[0, 8, 8, 0]} />
                      <Bar dataKey="conversionsCount" fill={GOLD_ACCENT} name="Conversions" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 space-y-3" style={{ height: '100%' }}>
                    <p className="text-base font-medium">No lead source data available</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md text-center">
                      Lead sources will appear here once contacts are assigned to sources.
                    </p>
                  </div>
                )}
                </CardContent>
              </Card>
            </motion.div>
            </>
          )}

          {/* Band 3: Row 3 - AI Panels (3 panels, each spans 4 columns) */}
          {stats && safeStats && (
            <>
            {/* AI Panel 1: AI Insights & Alerts */}
            <motion.div 
              className="ai-panel"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.55 }}
              whileHover={{ scale: 1.01, y: -2 }}
            >
              <AIInsightsAndAlerts tenantId={tenantId} stats={safeStats} />
            </motion.div>
            
            {/* AI Panel 2: Predictive Analytics */}
            <motion.div 
              className="ai-panel"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              whileHover={{ scale: 1.01, y: -2 }}
            >
              <PredictiveAnalytics tenantId={tenantId} stats={safeStats} />
            </motion.div>
            
            {/* AI Panel 3: Health Monitoring */}
            <motion.div 
              className="ai-panel"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.65 }}
              whileHover={{ scale: 1.01, y: -2 }}
            >
              <HealthMonitoring tenantId={tenantId} stats={safeStats} />
            </motion.div>
            </>
          )}

          {/* Band 3: Row 4 - Widgets (3 cards, each spans 4 columns) */}
          {stats && safeStats && (
            <>
            {/* Widget 1: Ask AI About Your Funnel */}
            <motion.div 
              className="widget-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
              whileHover={{ y: -2 }}
            >
              <AIQuestionInput tenantId={tenantId} />
            </motion.div>
            
            {/* Widget 2: Customer Issues */}
            <motion.div 
              className="widget-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.75 }}
              whileHover={{ y: -2 }}
            >
              <Card className="border-0 rounded-xl" style={{ height: '100%', padding: 0, borderRadius: 0, background: 'transparent' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Customer Issues
                  </CardTitle>
                  <CardDescription className="text-sm">Open tickets and SLA status</CardDescription>
                </CardHeader>
                <CardContent style={{ height: 'calc(100% - 100px)', overflow: 'visible', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Open Tickets</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Requires attention</p>
                      </div>
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                        0
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">SLA Status</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">All on track</p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <Link href={tenantId ? `/crm/${tenantId}/Tickets` : '#'} className="mt-auto">
                    <Button variant="outline" className="w-full mt-2 text-xs py-1">
                      View All Tickets
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Widget 3: Latest Campaigns */}
            <motion.div 
              className="widget-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              whileHover={{ y: -2 }}
            >
              <Card className="border-0 rounded-xl" style={{ height: '100%', padding: 0, borderRadius: 0, background: 'transparent' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Mail className="h-5 w-5 text-purple-600" />
                    Latest Campaigns
                  </CardTitle>
                  <CardDescription className="text-sm">Recent marketing campaigns</CardDescription>
                </CardHeader>
                <CardContent style={{ height: 'calc(100% - 100px)', overflow: 'visible', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div className="space-y-2 flex-1">
                    <div className="p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Q4 Product Launch</p>
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <span>Sent: 1,250</span>
                        <span>Open: 42%</span>
                      </div>
                    </div>
                    <div className="p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Holiday Promotion</p>
                        <Badge variant="outline" className="text-xs bg-gray-100">Completed</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <span>Sent: 2,100</span>
                        <span>Open: 38%</span>
                      </div>
                    </div>
                  </div>
                  <Link href={tenantId ? `/crm/${tenantId}/Campaigns` : '#'} className="mt-auto">
                    <Button variant="outline" className="w-full mt-2 text-xs py-1">
                      View All Campaigns
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
            </>
          )}

          {/* Band 3: Row 5 - Quarterly Table (full width) */}
          {safeStats && (
            <motion.div 
              className="quarterly-table"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.85 }}
            >
              <Card className="border-0 rounded-xl" style={{ height: '100%', padding: 0, borderRadius: 0, background: 'transparent' }}>
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
                          {(Array.isArray(safeStats.quarterlyPerformance) ? safeStats.quarterlyPerformance : []).map((q, idx) => (
                            <th key={idx} className="text-right p-3 font-semibold text-gray-700">{q?.quarter || ''}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-3 font-medium">Leads Created</td>
                          {(Array.isArray(safeStats.quarterlyPerformance) ? safeStats.quarterlyPerformance : []).map((q, idx) => (
                            <td key={idx} className="text-right p-3">{((q?.leadsCreated ?? 0) || 0).toLocaleString()}</td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-3 font-medium">Deals Created</td>
                          {(Array.isArray(safeStats.quarterlyPerformance) ? safeStats.quarterlyPerformance : []).map((q, idx) => (
                            <td key={idx} className="text-right p-3">{((q?.dealsCreated ?? 0) || 0).toLocaleString()}</td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-3 font-medium">Deals Won</td>
                          {(Array.isArray(safeStats.quarterlyPerformance) ? safeStats.quarterlyPerformance : []).map((q, idx) => (
                            <td key={idx} className="text-right p-3 font-semibold text-green-600">{((q?.dealsWon ?? 0) || 0).toLocaleString()}</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 font-medium">Revenue</td>
                          {(Array.isArray(safeStats.quarterlyPerformance) ? safeStats.quarterlyPerformance : []).map((q, idx) => (
                            <td key={idx} className="text-right p-3 font-semibold text-blue-600">{formatINRForDisplay((q?.revenue ?? 0) || 0)}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          </div>
        </div>
          </>
        )}
      </div>

      {/* Floating AI Assistant - Lazy loaded */}
      {tenantId && <FloatingAIAssistant tenantId={tenantId} />}
      
      {/* Quick Actions Panel */}
      <QuickActionsPanel tenantId={tenantId} />
      
      {/* Command Palette */}
      <CommandPalette 
        tenantId={tenantId} 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />
    </div>
  )
}
