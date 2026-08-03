'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { CrmHomeDashboard } from '@crm/crm/[tenantId]/Home/CrmHomeDashboard'
import { DashboardSkeleton } from '@/components/modules/dashboard'

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
    return <DashboardSkeleton />
  }

  const safeStats = (() => {
    if (!stats) {
      return {
        dealsCreatedThisMonth: 0,
        revenueThisMonth: 0,
        dealsClosingThisMonth: 0,
        overdueTasks: 0,
        pipelineByStage: [] as { stage: string; count: number }[],
        monthlyLeadCreation: [] as { month: string; count: number }[],
        topLeadSources: [] as {
          name: string
          leadsCount: number
          conversionsCount: number
          totalValue: number
          conversionRate: number
        }[],
      }
    }
    return {
      dealsCreatedThisMonth: Number(stats.dealsCreatedThisMonth || 0),
      revenueThisMonth: Number(stats.revenueThisMonth || 0),
      dealsClosingThisMonth: Number(stats.dealsClosingThisMonth || 0),
      overdueTasks: Number(stats.overdueTasks || 0),
      pipelineByStage: Array.isArray(stats.pipelineByStage) ? stats.pipelineByStage : [],
      monthlyLeadCreation: Array.isArray(stats.monthlyLeadCreation) ? stats.monthlyLeadCreation : [],
      topLeadSources: Array.isArray(stats.topLeadSources) ? stats.topLeadSources : [],
    }
  })()

  const tasksToday = Array.isArray(tasksViewData?.myOpenActivitiesToday)
    ? tasksViewData!.myOpenActivitiesToday.map((a: any) => ({
        id: String(a.id),
        title: String(a.title || 'Task'),
        dueDate: a.dueDate,
      }))
    : []

  const activityItems = Array.isArray(activityFeedData)
    ? activityFeedData.map((a: any) => ({
        id: String(a.id || a._id || Math.random()),
        summary: a.summary || a.title || a.description,
        type: a.type,
        createdAt: a.createdAt,
      }))
    : []

  return (
    <CrmHomeDashboard
      tenantId={tenantId || ''}
      userName={user?.name}
      loading={loading}
      error={error}
      stats={safeStats}
      timePeriod={timePeriod}
      onTimePeriodChange={setTimePeriod}
      currentView={currentView}
      onViewChange={(view) => {
        if (!tenantId || typeof tenantId !== 'string') return
        switch (view) {
          case 'tasks':
            router.push(`/crm/${tenantId}/Tasks/`)
            break
          case 'pipeline':
            router.push(`/crm/${tenantId}/Deals/`)
            break
          case 'activity':
            router.push(`/crm/${tenantId}/Home/?view=activity`)
            break
          case 'sales':
            router.push(`/crm/${tenantId}/Home/?view=sales`)
            break
          case 'custom':
            router.push(`/crm/${tenantId}/Home/?view=custom`)
            break
          default:
            router.push(`/crm/${tenantId}/Home/`)
        }
      }}
      tasksToday={tasksToday}
      activityItems={activityItems}
      isDark={isDark}
    />
  )
}
