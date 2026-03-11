'use client'

// Force client-side only rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useDeals, useDeleteDeal } from '@/lib/hooks/use-api'
import { useAuthStore } from '@/lib/stores/auth'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { format, isThisMonth, isPast, isWithinInterval } from 'date-fns'
import { Briefcase, TrendingUp, CheckCircle2, XCircle, Calendar, DollarSign, AlertCircle, Filter, LayoutGrid, List, Columns3 } from 'lucide-react'
// ModuleTopBar is now in layout.tsx
import { PageLoading } from '@/components/ui/loading'
import { getTimePeriodBounds, validateFilterParams, type DealCategory, type TimePeriod } from '@/lib/utils/crm-filters'
import { DealsKanban } from '@/components/crm/DealsKanban'

// Deal Row Component
function DealRow({ deal, tenantId, onDelete }: { deal: any; tenantId: string; onDelete: (id: string) => void }) {
  const getContactName = () => {
    const contact = deal.contact
    if (!contact) return 'No contact'
    if (typeof contact === 'string') return contact
    if (typeof contact === 'object') {
      return String(contact.name || contact.email || contact.id || 'No contact')
    }
    return String(contact)
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 transition-colors">
      <div className="flex-1 flex items-center gap-4">
        <div className="flex-1">
          <Link 
            href={`/crm/${tenantId}/Deals/${deal.id}`} 
            className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {deal.name}
          </Link>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span>Contact: {getContactName()}</span>
            {deal.expectedCloseDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(deal.expectedCloseDate), 'MMM dd, yyyy')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ₹{deal.value?.toLocaleString() || '0'}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            deal.stage === 'won' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            deal.stage === 'lost' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}>
            {deal.stage || 'lead'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Link href={`/crm/${tenantId}/Deals/${deal.id}`}>
          <Button variant="ghost" size="sm">View</Button>
        </Link>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onDelete(deal.id)}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Delete
        </Button>
      </div>
    </div>
  )
}

export default function CRMDealsPage() {
  try {
    const params = useParams()
    const searchParams = useSearchParams()
    const tenantId = params?.tenantId as string
    const { token } = useAuthStore()
    const [uiPage, setUiPage] = useState(1)
    const [stageFilter, setStageFilter] = useState<string>('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'financial-year' | 'year'>('month')
    const queryClient = useQueryClient()
    // Use bypassCache on initial load to ensure fresh data after seeding.
    // Pass tenantId from the route so the API returns deals for the tenant we're viewing.
    const { data, isLoading, error: dealsError, refetch } = useDeals({ 
      page: 1, 
      limit: 1000, 
      stage: stageFilter || undefined,
      bypassCache: true, // Always bypass cache to get fresh data
      tenantId: tenantId || undefined,
    })
    const deleteDeal = useDeleteDeal()
    const hasCheckedDataRef = useRef(false)
    const hasTriggeredSeedRef = useRef(false)
    const [pageError, setPageError] = useState<Error | null>(null)
    const [seedStatus, setSeedStatus] = useState<{ running: boolean; elapsed?: number } | null>(null)
    const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)
    const [diagnosticsResult, setDiagnosticsResult] = useState<string | null>(null)
    const hasTriggeredEnsureDemoRef = useRef(false)
    const [viewMode, setViewMode] = useState<'list' | 'pipeline' | 'board'>('list')
    const [rowsPerPage, setRowsPerPage] = useState<10 | 20 | 50 | 100>(10)
    const [sortKey, setSortKey] = useState<'value' | 'stage' | 'expectedCloseDate'>('expectedCloseDate')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
    const [selectedDealIds, setSelectedDealIds] = useState<string[]>([])
    const [bulkStage, setBulkStage] = useState<string>('')

    // When page loads with 0 deals, ensure demo data once so demos are never empty
    useEffect(() => {
      if (
        hasTriggeredEnsureDemoRef.current ||
        !tenantId ||
        !token ||
        isLoading ||
        !data
      ) return
      const total = data?.pagination?.total ?? 0
      const dealsLen = data?.deals?.length ?? 0
      if (total > 0 || dealsLen > 0) return
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
              queryClient.invalidateQueries({ queryKey: ['deals'] })
              await refetch()
            }
          }
        } catch (_) {}
      })()
    }, [tenantId, token, isLoading, data, refetch, queryClient])

    // Function to refresh deals data (bypass cache)
    const refreshDeals = async () => {
      if (!token) return
      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      // Use refetch from useDeals hook which already has bypassCache=true
      try {
        const result = await refetch()
        if (result.data) {
          console.log('[DEALS_PAGE] Refreshed data:', { 
            dealsCount: result.data?.deals?.length || 0, 
            total: result.data?.pagination?.total || 0 
          })
        }
      } catch (error) {
        console.error('[DEALS_PAGE] Refresh error:', error)
      }
    }

  // DISABLED: Automatic seed checking to prevent refresh loops
  // Users must manually click "Seed Demo Data" button if needed
  // This prevents the page from refreshing in a loop

  // Handle URL query parameters - use shared validation utility
  useEffect(() => {
    const category = searchParams?.get('category')
    const filter = searchParams?.get('filter') // Support old format
    const timePeriodParam = searchParams?.get('timePeriod')
    const period = searchParams?.get('period') // Support old format
    
    // Use shared validation utility to ensure consistency
    const { category: validatedCategory, timePeriod: validatedTimePeriod } = validateFilterParams(
      category || filter || undefined,
      timePeriodParam || period || undefined
    )
    
    setSelectedCategory(validatedCategory)
    setTimePeriod(validatedTimePeriod)
  }, [searchParams])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      try {
        await deleteDeal.mutateAsync({ id, tenantId })
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete deal')
      }
    }
  }

  // Use shared filter utility for time period bounds
  const getTimePeriodBoundsLocal = () => {
    return getTimePeriodBounds(timePeriod)
  }

  // Categorize deals using shared filter logic
  const categorizedDeals = useMemo(() => {
    if (!data?.deals) {
      console.log('[DEALS_PAGE] No deals data:', { data, hasData: !!data, hasDeals: !!data?.deals })
      return {
        created: [],
        closing: [],
        won: [],
        lost: [],
        allWon: [],
        allLost: [],
        byStage: {} as Record<string, any[]>,
        all: []
      }
    }

    const period = getTimePeriodBounds()
    const periodStart = period.start
    const periodEnd = period.end
    
    // Debug logging
    console.log('[DEALS_PAGE] Categorizing deals:', {
      totalDeals: data.deals.length,
      timePeriod,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      sampleDeal: data.deals[0] ? {
        id: data.deals[0].id,
        name: data.deals[0].name,
        stage: data.deals[0].stage,
        createdAt: data.deals[0].createdAt,
        expectedCloseDate: data.deals[0].expectedCloseDate,
        actualCloseDate: data.deals[0].actualCloseDate,
      } : null
    })

    const created: any[] = []
    const closing: any[] = []
    const won: any[] = []
    const lost: any[] = []
    const allWon: any[] = []
    const allLost: any[] = []
    const byStage: Record<string, any[]> = {}

    data.deals.forEach((deal: any) => {
      // Created in period
      if (deal.createdAt) {
        const createdDate = new Date(deal.createdAt)
        if (isWithinInterval(createdDate, { start: periodStart, end: periodEnd })) {
          created.push(deal)
        }
      }

      // Closing in period
      if (deal.expectedCloseDate) {
        const closeDate = new Date(deal.expectedCloseDate)
        if (isWithinInterval(closeDate, { start: periodStart, end: periodEnd })) {
          closing.push(deal)
        }
      }

      // Won deals
      if (deal.stage === 'won') {
        allWon.push(deal)
        // Won in period - prioritize actualCloseDate, then closedAt, then updatedAt, then createdAt
        // For revenue calculation, we need to check when the deal was actually closed/won
        const closedDate = deal.actualCloseDate || deal.closedAt || deal.updatedAt || (deal.createdAt && deal.stage === 'won' ? deal.createdAt : null)
        if (closedDate) {
          try {
            const closed = new Date(closedDate)
            // Validate date and check if it's within the period
            if (!isNaN(closed.getTime())) {
              // Check if date is within period (inclusive of start and end)
              const dateTime = closed.getTime()
              const startTime = periodStart.getTime()
              const endTime = periodEnd.getTime()
              if (dateTime >= startTime && dateTime <= endTime) {
                won.push(deal)
              }
            }
          } catch (e) {
            // If date parsing fails, skip this deal for period filtering
            console.warn('Failed to parse closed date for deal:', deal.id, closedDate, e)
          }
        } else {
          // If no close date but deal is won, include it if created in period (fallback)
          if (deal.createdAt) {
            try {
              const created = new Date(deal.createdAt)
              if (!isNaN(created.getTime())) {
                const dateTime = created.getTime()
                const startTime = periodStart.getTime()
                const endTime = periodEnd.getTime()
                if (dateTime >= startTime && dateTime <= endTime) {
                  won.push(deal)
                }
              }
            } catch (e) {
              console.warn('Failed to parse created date for won deal:', deal.id, e)
            }
          }
        }
      }

      // Lost deals
      if (deal.stage === 'lost') {
        allLost.push(deal)
        // Lost in period - prioritize actualCloseDate, then updatedAt, then createdAt
        const closedDate = deal.actualCloseDate || deal.updatedAt || (deal.createdAt && deal.stage === 'lost' ? deal.createdAt : null)
        if (closedDate) {
          try {
            const closed = new Date(closedDate)
            // Validate date and check if it's within the period
            if (!isNaN(closed.getTime())) {
              // Check if date is within period (inclusive of start and end)
              const dateTime = closed.getTime()
              const startTime = periodStart.getTime()
              const endTime = periodEnd.getTime()
              if (dateTime >= startTime && dateTime <= endTime) {
                lost.push(deal)
              }
            }
          } catch (e) {
            // If date parsing fails, skip this deal for period filtering
            console.warn('Failed to parse closed date for deal:', deal.id, closedDate, e)
          }
        }
      }

      // By stage
      const stage = deal.stage || 'lead'
      if (!byStage[stage]) {
        byStage[stage] = []
      }
      byStage[stage].push(deal)
    })

    return {
      created: created.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      closing: closing.sort((a, b) => {
        if (!a.expectedCloseDate) return 1
        if (!b.expectedCloseDate) return -1
        return new Date(a.expectedCloseDate).getTime() - new Date(b.expectedCloseDate).getTime()
      }),
      won: won.sort((a, b) => {
        const aDate = a.actualCloseDate || a.updatedAt
        const bDate = b.actualCloseDate || b.updatedAt
        if (!aDate) return 1
        if (!bDate) return -1
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      }),
      lost: lost.sort((a, b) => {
        const aDate = a.actualCloseDate || a.updatedAt
        const bDate = b.actualCloseDate || b.updatedAt
        if (!aDate) return 1
        if (!bDate) return -1
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      }),
      allWon: allWon.sort((a, b) => {
        const aDate = a.actualCloseDate || a.updatedAt
        const bDate = b.actualCloseDate || b.updatedAt
        if (!aDate) return 1
        if (!bDate) return -1
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      }),
      allLost: allLost.sort((a, b) => {
        const aDate = a.actualCloseDate || a.updatedAt
        const bDate = b.actualCloseDate || b.updatedAt
        if (!aDate) return 1
        if (!bDate) return -1
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      }),
      byStage,
      all: data.deals
    }
  }, [data?.deals, timePeriod])

  const stats = useMemo(() => {
    const all = categorizedDeals.all
    const period = getTimePeriodBoundsLocal()
    const totalValue = all.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0)
    const wonValue = categorizedDeals.won.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0)
    const closingValue = categorizedDeals.closing.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0)

    return {
      total: all.length,
      created: categorizedDeals.created.length,
      closing: categorizedDeals.closing.length,
      won: categorizedDeals.won.length,
      lost: categorizedDeals.lost.length,
      totalValue,
      wonValue,
      closingValue,
      periodLabel: period.label,
      byStage: Object.keys(categorizedDeals.byStage).reduce((acc, stage) => {
        acc[stage] = categorizedDeals.byStage[stage].length
        return acc
      }, {} as Record<string, number>)
    }
  }, [categorizedDeals, timePeriod])

  const pipeline = useMemo(() => {
    const stageOrder = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
    const stageMeta: Record<string, { label: string; color: string }> = {
      lead: { label: 'Lead', color: 'bg-blue-500' },
      qualified: { label: 'Qualified', color: 'bg-teal-500' },
      proposal: { label: 'Proposal', color: 'bg-purple-500' },
      negotiation: { label: 'Negotiation', color: 'bg-amber-500' },
      won: { label: 'Won', color: 'bg-emerald-500' },
      lost: { label: 'Lost', color: 'bg-red-500' },
    }
    const segments = stageOrder.map((stage) => {
      const dealsInStage = categorizedDeals.byStage?.[stage] ?? []
      const value = dealsInStage.reduce((s: number, d: any) => s + (Number(d?.value) || 0), 0)
      return {
        stage,
        label: stageMeta[stage]?.label ?? stage,
        color: stageMeta[stage]?.color ?? 'bg-slate-400',
        count: dealsInStage.length,
        value,
      }
    })
    const totalValue = segments.reduce((s, seg) => s + seg.value, 0)
    return { totalValue, segments }
  }, [categorizedDeals.byStage])

  const topClosingDeals = useMemo(() => {
    return (categorizedDeals.closing ?? []).slice(0, 10)
  }, [categorizedDeals.closing])

  // Handle errors gracefully
  if (pageError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Deals Page</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{pageError.message}</p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return <PageLoading message="Loading deals..." fullScreen={false} />
  }

  // Handle API errors gracefully
  if (dealsError) {
    console.error('[DEALS_PAGE] Error fetching deals:', dealsError)
  }

  const deals = Array.isArray(data?.deals) ? data.deals : []

  const sortedDeals = useMemo(() => {
    const list = [...deals]
    const dir = sortDir === 'asc' ? 1 : -1
    list.sort((a: any, b: any) => {
      if (sortKey === 'value') {
        return (Number(a?.value) - Number(b?.value)) * dir
      }
      if (sortKey === 'stage') {
        return String(a?.stage ?? '').localeCompare(String(b?.stage ?? '')) * dir
      }
      // expectedCloseDate
      const aTime = a?.expectedCloseDate ? new Date(a.expectedCloseDate).getTime() : Number.POSITIVE_INFINITY
      const bTime = b?.expectedCloseDate ? new Date(b.expectedCloseDate).getTime() : Number.POSITIVE_INFINITY
      return (aTime - bTime) * dir
    })
    return list
  }, [deals, sortKey, sortDir])

  const totalDeals = sortedDeals.length
  const pageCount = Math.max(1, Math.ceil(totalDeals / rowsPerPage))
  const currentPage = Math.min(Math.max(1, uiPage), pageCount)
  const pageStart = (currentPage - 1) * rowsPerPage
  const pageEnd = Math.min(totalDeals, pageStart + rowsPerPage)
  const pagedDeals = sortedDeals.slice(pageStart, pageEnd)

  useEffect(() => {
    if (uiPage !== currentPage) setUiPage(currentPage)
    // When page changes, clear selection to avoid accidental bulk actions
    // (keeps selection behavior predictable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const allOnPageSelected =
    pagedDeals.length > 0 && pagedDeals.every((d: any) => selectedDealIds.includes(d.id))

  const toggleSelectAllOnPage = () => {
    const ids = pagedDeals.map((d: any) => d.id)
    if (allOnPageSelected) {
      setSelectedDealIds((prev) => prev.filter((id) => !ids.includes(id)))
    } else {
      setSelectedDealIds((prev) => Array.from(new Set([...prev, ...ids])))
    }
  }

  // Get deals to display based on selected category
  const getDealsToDisplay = () => {
    if (!selectedCategory) return null

    if (selectedCategory === 'created') return categorizedDeals.created
    if (selectedCategory === 'closing') return categorizedDeals.closing
    if (selectedCategory === 'won') return categorizedDeals.won
    if (selectedCategory === 'lost') return categorizedDeals.lost
    if (selectedCategory.startsWith('stage-')) {
      const stage = selectedCategory.replace('stage-', '')
      return categorizedDeals.byStage[stage] || []
    }
    return null
  }

  const displayedDeals = getDealsToDisplay()

  return (
    <div className="w-full flex flex-col flex-1 min-w-0 bg-gray-50 dark:bg-gray-900 relative" style={{ zIndex: 1 }}>
      <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Deals</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your sales deals and pipeline</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-100 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode('pipeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'pipeline'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Pipeline
              </button>
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'board'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Columns3 className="w-4 h-4" />
                Board
              </button>
            </div>
            {viewMode === 'list' && (
              <div className="flex items-center gap-2 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30">
                <Filter className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <select
                  value={timePeriod}
                  onChange={(e) => {
                    setTimePeriod(e.target.value as 'month' | 'quarter' | 'financial-year' | 'year')
                    setSelectedCategory(null)
                  }}
                  className="text-sm font-medium text-purple-700 dark:text-purple-300 bg-transparent border-0 focus:outline-none cursor-pointer"
                >
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="financial-year">This Financial Year</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            )}
            <Link href={`/crm/${tenantId}/Deals/new`}>
              <Button>New Deal</Button>
            </Link>
          </div>
        </div>

        {viewMode !== 'list' ? (
          <DealsKanban tenantId={tenantId} />
        ) : (
          <>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className={`border-blue-200 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-800 cursor-pointer transition-all hover:shadow-md ${
              selectedCategory === 'created' ? 'ring-2 ring-blue-500 shadow-lg' : ''
            }`}
            onClick={() => setSelectedCategory(selectedCategory === 'created' ? null : 'created')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Created {stats.periodLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.created}</div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">New deals {stats.periodLabel.toLowerCase()}</p>
              {selectedCategory === 'created' && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">Click to view details</p>
              )}
            </CardContent>
          </Card>

          <Card 
            className={`border-orange-200 bg-orange-50 dark:bg-orange-900/30 dark:border-orange-800 cursor-pointer transition-all hover:shadow-md ${
              selectedCategory === 'closing' ? 'ring-2 ring-orange-500 shadow-lg' : ''
            }`}
            onClick={() => setSelectedCategory(selectedCategory === 'closing' ? null : 'closing')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Closing {stats.periodLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.closing}</div>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                ₹{stats.closingValue.toLocaleString()} value
              </p>
              {selectedCategory === 'closing' && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">Click to view details</p>
              )}
            </CardContent>
          </Card>

          <Card 
            className={`border-green-200 bg-green-50 dark:bg-green-900/30 dark:border-green-800 cursor-pointer transition-all hover:shadow-md ${
              selectedCategory === 'won' ? 'ring-2 ring-green-500 shadow-lg' : ''
            }`}
            onClick={() => setSelectedCategory(selectedCategory === 'won' ? null : 'won')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Won {stats.periodLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.won}</div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                ₹{stats.wonValue.toLocaleString()} revenue
              </p>
              {selectedCategory === 'won' && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">Click to view details</p>
              )}
            </CardContent>
          </Card>

          <Card 
            className={`border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-800 cursor-pointer transition-all hover:shadow-md ${
              selectedCategory === 'lost' ? 'ring-2 ring-red-500 shadow-lg' : ''
            }`}
            onClick={() => setSelectedCategory(selectedCategory === 'lost' ? null : 'lost')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Lost {stats.periodLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.lost}</div>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">Deals lost {stats.periodLabel.toLowerCase()}</p>
              {selectedCategory === 'lost' && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">Click to view details</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Under summary cards: mini pipeline + top 10 deals closing */}
        {!selectedCategory && deals.length > 0 && (
          <div className="space-y-4">
            <Card className="border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                  Pipeline by stage (value)
                </CardTitle>
                <CardDescription className="text-xs">
                  A quick snapshot of value distribution across stages.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 flex">
                  {pipeline.totalValue > 0 ? (
                    pipeline.segments.map((seg) => {
                      const pct = Math.max(0, (seg.value / pipeline.totalValue) * 100)
                      if (pct <= 0) return null
                      return (
                        <div
                          key={seg.stage}
                          className={seg.color}
                          style={{ width: `${pct}%` }}
                          title={`${seg.label}: ₹${seg.value.toLocaleString('en-IN')} · ${seg.count} deal(s)`}
                        />
                      )
                    })
                  ) : (
                    <div className="w-full bg-slate-300/60 dark:bg-slate-700/60" />
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-gray-400">
                  {pipeline.segments.map((seg) => (
                    <div key={seg.stage} className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-sm ${seg.color}`} />
                      <span className="font-medium">{seg.label}</span>
                      <span className="text-slate-500 dark:text-gray-500">
                        · ₹{(seg.value / 1_00_000).toFixed(1)} L · {seg.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                  Top deals closing {stats.periodLabel.toLowerCase()}
                </CardTitle>
                <CardDescription className="text-xs">
                  Highest priority deals expected to close soon.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topClosingDeals.length === 0 ? (
                  <div className="text-sm text-slate-600 dark:text-gray-400">
                    No deals are marked as closing {stats.periodLabel.toLowerCase()}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topClosingDeals.map((deal: any) => (
                      <div key={deal.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <div className="min-w-0">
                          <Link href={`/crm/${tenantId}/Deals/${deal.id}`} className="text-sm font-medium text-slate-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block">
                            {deal.name}
                          </Link>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-gray-400">
                            {deal.stage && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 capitalize">
                                {deal.stage}
                              </span>
                            )}
                            {deal.expectedCloseDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(deal.expectedCloseDate), 'MMM dd')}
                              </span>
                            )}
                            {typeof deal.probability === 'number' && (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200">
                                {deal.probability}% probability
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-gray-100 whitespace-nowrap ml-3">
                          ₹{Number(deal.value ?? 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Show filtered view when a stat card is clicked */}
        {selectedCategory && displayedDeals !== null && (
          <div className="space-y-4">
            {displayedDeals && Array.isArray(displayedDeals) && displayedDeals.length > 0 ? (
              <Card className={`${
                selectedCategory === 'created' ? 'border-blue-200 ring-2 ring-blue-500' :
                selectedCategory === 'closing' ? 'border-orange-200 ring-2 ring-orange-500' :
                selectedCategory === 'won' ? 'border-green-200 ring-2 ring-green-500' :
                selectedCategory === 'lost' ? 'border-red-200 ring-2 ring-red-500' :
                'ring-2 ring-gray-500'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`${
                        selectedCategory === 'created' ? 'text-blue-800 dark:text-blue-200' :
                        selectedCategory === 'closing' ? 'text-orange-800 dark:text-orange-200' :
                        selectedCategory === 'won' ? 'text-green-800 dark:text-green-200' :
                        selectedCategory === 'lost' ? 'text-red-800 dark:text-red-200' :
                        ''
                      } flex items-center gap-2`}>
                        {selectedCategory === 'created' && <Briefcase className="w-5 h-5" />}
                        {selectedCategory === 'closing' && <Calendar className="w-5 h-5" />}
                        {selectedCategory === 'won' && <CheckCircle2 className="w-5 h-5" />}
                        {selectedCategory === 'lost' && <XCircle className="w-5 h-5" />}
                        {selectedCategory === 'created' && `Deals Created ${stats.periodLabel} (${displayedDeals.length})`}
                        {selectedCategory === 'closing' && `Deals Closing ${stats.periodLabel} (${displayedDeals.length})`}
                        {selectedCategory === 'won' && `Deals Won ${stats.periodLabel} (${displayedDeals.length})`}
                        {selectedCategory === 'lost' && `Deals Lost ${stats.periodLabel} (${displayedDeals.length})`}
                        {selectedCategory.startsWith('stage-') && `Deals - ${selectedCategory.replace('stage-', '').toUpperCase()} (${displayedDeals.length})`}
                      </CardTitle>
                      <CardDescription>
                        {selectedCategory === 'created' && `Deals created ${stats.periodLabel.toLowerCase()}`}
                        {selectedCategory === 'closing' && `Deals expected to close ${stats.periodLabel.toLowerCase()}`}
                        {selectedCategory === 'won' && `Deals won ${stats.periodLabel.toLowerCase()}`}
                        {selectedCategory === 'lost' && `Deals lost ${stats.periodLabel.toLowerCase()}`}
                        {selectedCategory.startsWith('stage-') && `Deals in ${selectedCategory.replace('stage-', '')} stage`}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                    >
                      Show All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Array.isArray(displayedDeals) ? displayedDeals.map((deal: any) => (
                      <DealRow key={deal.id} deal={deal} tenantId={tenantId} onDelete={handleDelete} />
                    )) : (
                      <p className="text-gray-600 dark:text-gray-400">Invalid deals data format</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    No deals found in this category for {stats.periodLabel.toLowerCase()}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Total deals in database: {deals.length}. Try changing the time period filter or seed demo data.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                    >
                      Show All Deals
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          if (!token) {
                            alert('Please log in first')
                            return
                          }
                          // Use comprehensive seed with background mode to avoid timeout
                          // Comprehensive seed creates all data including 200 deals, 150 contacts, etc.
                          const response = await fetch(`/api/admin/seed-demo-data?background=true&comprehensive=true&tenantId=${encodeURIComponent(tenantId)}`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                          })
                          if (response.ok) {
                            const data = await response.json()
                            setSeedStatus({ running: true, elapsed: 0 })
                            console.log(`[DEALS_PAGE] Seed started:`, data)
                            
                            // Start polling for seed completion
                            let pollCount = 0
                            const maxPolls = 60 // 5 minutes max (60 * 5s = 300s)
                            const pollInterval = setInterval(async () => {
                              pollCount++
                              try {
                                const statusResponse = await fetch(`/api/admin/seed-demo-data?checkStatus=true&tenantId=${tenantId}`, {
                                  headers: { 'Authorization': `Bearer ${token}` },
                                })
                                if (statusResponse.ok) {
                                  const statusData = await statusResponse.json()
                                  console.log(`[DEALS_PAGE] Seed status check ${pollCount}:`, statusData)
                                  
                                  // Check if seed likely completed (data exists but tracking shows running)
                                  const likelyCompleted = statusData.likelyCompleted || (statusData.hasData && !statusData.running)
                                  const isRunning = statusData.running && !likelyCompleted
                                  
                                  // Show error if one occurred
                                  if (statusData.lastError) {
                                    console.error(`[DEALS_PAGE] ❌ Seed error:`, statusData.lastError)
                                    alert(`Seed error: ${statusData.lastError}`)
                                  }
                                  
                                  setSeedStatus({ running: isRunning, elapsed: statusData.elapsed })
                                  
                                  if (!isRunning || pollCount >= maxPolls) {
                                    clearInterval(pollInterval)
                                    if (!isRunning || likelyCompleted) {
                                      console.log(`[DEALS_PAGE] Seed completed (likelyCompleted: ${likelyCompleted}), refreshing data...`)
                                      await refreshDeals()
                                      // Show success message
                                      if (statusData.dataCounts) {
                                        const { contacts, deals, tasks } = statusData.dataCounts
                                        console.log(`[DEALS_PAGE] ✅ Seed completed! Created: ${contacts} contacts, ${deals} deals, ${tasks} tasks`)
                                      }
                                    } else {
                                      console.warn(`[DEALS_PAGE] ⚠️ Seed polling timed out after ${maxPolls} checks`)
                                    }
                                  }
                                }
                              } catch (e) {
                                console.error(`[DEALS_PAGE] Status check error:`, e)
                                if (pollCount >= maxPolls) {
                                  clearInterval(pollInterval)
                                }
                              }
                            }, 5000) // Poll every 5 seconds
                          } else {
                            const errorData = await response.json().catch(() => ({}))
                            setSeedStatus({ running: false })
                            alert(`Failed to seed data: ${errorData.message || 'Unknown error'}. ${errorData.suggestion || ''}`)
                          }
                        } catch (err) {
                          console.error('Seed error:', err)
                          alert('Error seeding data. Please check console.')
                          setSeedStatus({ running: false })
                        }
                      }}
                    >
                          Seed Demo Data
                        </Button>
                        <Dialog open={diagnosticsOpen} onOpenChange={setDiagnosticsOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  if (!token) {
                                    alert('Please log in first')
                                    return
                                  }
                                  console.log(`[DEALS_PAGE] Running seed diagnosis...`)
                                  setDiagnosticsOpen(true)
                                  setDiagnosticsResult('Running diagnosis...')
                                  
                                  const response = await fetch(`/api/admin/seed-diagnosis?tenantId=${encodeURIComponent(tenantId)}`, {
                                    headers: { 'Authorization': `Bearer ${token}` },
                                  })
                                  if (response.ok) {
                                    const diagnostics = await response.json()
                                    console.log(`[DEALS_PAGE] Diagnosis results:`, diagnostics)
                                    
                                    // Format diagnosis results for display
                                    let message = `🔍 Seed Diagnosis Results\n\n`
                                    message += `Timestamp: ${diagnostics.timestamp || new Date().toISOString()}\n`
                                    message += `Tenant ID: ${diagnostics.tenantId}\n\n`
                                    message += `Status: ${diagnostics.summary?.status || 'unknown'}\n`
                                    message += `Checks: ${diagnostics.summary?.passedChecks || 0}/${diagnostics.summary?.totalChecks || 0} passed\n`
                                    message += `Failed: ${diagnostics.summary?.failedChecks || 0}\n`
                                    message += `Warnings: ${diagnostics.summary?.warnings || 0}\n\n`
                                    
                                    if (diagnostics.errors.length > 0) {
                                      message += `❌ ERRORS:\n${diagnostics.errors.map((e: string) => `  • ${e}`).join('\n')}\n\n`
                                    }
                                    
                                    if (diagnostics.warnings.length > 0) {
                                      message += `⚠️ WARNINGS:\n${diagnostics.warnings.map((w: string) => `  • ${w}`).join('\n')}\n\n`
                                    }
                                    
                                    if (diagnostics.recommendations.length > 0) {
                                      message += `💡 RECOMMENDATIONS:\n${diagnostics.recommendations.map((r: string) => `  • ${r}`).join('\n')}\n\n`
                                    }
                                    
                                    // Add check details
                                    message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
                                    message += `DETAILED CHECKS:\n`
                                    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
                                    Object.entries(diagnostics.checks || {}).forEach(([key, check]: [string, any]) => {
                                      const icon = check.status === 'ok' ? '✅' : check.status === 'error' ? '❌' : check.status === 'warning' ? '⚠️' : 'ℹ️'
                                      message += `${icon} ${key.toUpperCase().replace(/([A-Z])/g, (_, c) => ' ' + c).trim()}:\n`
                                      message += `   Status: ${check.status}\n`
                                      message += `   Message: ${check.message}\n`
                                      if (check.error) {
                                        message += `   Error: ${check.error}\n`
                                      }
                                      if (check.errorCode) {
                                        message += `   Error Code: ${check.errorCode}\n`
                                      }
                                      if (check.errorMeta) {
                                        message += `   Error Meta: ${JSON.stringify(check.errorMeta)}\n`
                                      }
                                      if (check.count !== undefined) {
                                        message += `   Count: ${check.count}\n`
                                      }
                                      message += `\n`
                                    })
                                    
                                    // Add JSON for advanced users
                                    message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
                                    message += `RAW JSON (for developers):\n`
                                    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
                                    message += JSON.stringify(diagnostics, null, 2)
                                    
                                    setDiagnosticsResult(message)
                                    
                                    // Also log to console for detailed inspection
                                    console.log(`[DEALS_PAGE] Full diagnosis:`, JSON.stringify(diagnostics, null, 2))
                                  } else {
                                    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
                                    setDiagnosticsResult(`❌ Diagnosis failed:\n\n${error.error || error.message || 'Unknown error'}`)
                                  }
                                } catch (err) {
                                  console.error('Diagnosis error:', err)
                                  setDiagnosticsResult(`❌ Error running diagnosis:\n\n${err instanceof Error ? err.message : String(err)}`)
                                }
                              }}
                            >
                              🔍 Run Diagnosis
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                              <DialogTitle>Seed Diagnosis Results</DialogTitle>
                              <DialogDescription>
                                Copy the results below to share with developers or for troubleshooting
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-hidden flex flex-col">
                              <div className="flex justify-end mb-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (diagnosticsResult) {
                                      navigator.clipboard.writeText(diagnosticsResult).then(() => {
                                        alert('Diagnosis results copied to clipboard!')
                                      }).catch(() => {
                                        alert('Failed to copy. Please select and copy manually.')
                                      })
                                    }
                                  }}
                                >
                                  📋 Copy to Clipboard
                                </Button>
                              </div>
                              <textarea
                                readOnly
                                value={diagnosticsResult || 'Running diagnosis...'}
                                className="flex-1 w-full p-4 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-sm font-mono resize-none"
                                style={{ minHeight: '400px' }}
                                onClick={(e) => {
                                  // Select all text when clicked for easy copying
                                  ;(e.target as HTMLTextAreaElement).select()
                                }}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

        {/* Show all deals when no filter is selected */}
        {!selectedCategory && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Deals ({deals.length})</CardTitle>
                  <CardDescription>View and manage all your deals</CardDescription>
                </div>
                <select
                  value={stageFilter}
                  onChange={(e) => {
                    setStageFilter(e.target.value)
                    setUiPage(1)
                    if (e.target.value) {
                      setSelectedCategory(`stage-${e.target.value}`)
                    }
                  }}
                  className="flex h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  <option value="">All Stages</option>
                  <option value="lead">Lead</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {deals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                  </div>
                  <p className="text-slate-900 dark:text-gray-100 font-semibold mb-1">No deals yet</p>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create your first deal or seed demo data to explore the pipeline views.
                  </p>
                  {seedStatus?.running ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Seeding demo data in progress...
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        {seedStatus.elapsed ? `Running for ${Math.floor(seedStatus.elapsed / 1000)} seconds` : 'This may take 30-60 seconds'}
                      </p>
                      <p className="text-xs text-gray-400">
                        The page will refresh automatically when complete
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500 mb-4">
                        {isLoading ? 'Loading deals...' : 'Deals will appear here once created. The seed script should create demo deals automatically.'}
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Link href={`/crm/${tenantId}/Deals/new`}>
                          <Button>Create Your First Deal</Button>
                        </Link>
                        <Button 
                          variant="outline"
                          onClick={async () => {
                            try {
                              const token = useAuthStore.getState().token
                              if (!token) {
                                alert('Please log in first')
                                return
                              }
                              setSeedStatus({ running: true, elapsed: 0 })
                              // IMPORTANT: Pass tenantId to ensure seed uses correct tenant
                              const response = await fetch(`/api/admin/seed-demo-data?comprehensive=true&background=true&tenantId=${encodeURIComponent(tenantId)}`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` },
                              })
                              const data = await response.json().catch(() => ({}))
                              console.log(`[DEALS_PAGE] Seed response:`, data)
                              if (response.ok) {
                                setSeedStatus({ running: true, elapsed: 0 })
                                alert(data.message || `Demo data seeding started in background for tenant ${tenantId}. Please wait 30-60 seconds, then click "Refresh Data" button.`)
                                
                                // Poll seed status every 5 seconds
                                let pollCount = 0
                                const maxPolls = 24 // 2 minutes max (24 * 5s)
                                const pollInterval = setInterval(async () => {
                                  pollCount++
                                  try {
                                    const statusResponse = await fetch(`/api/admin/seed-demo-data?checkStatus=true&tenantId=${tenantId}`, {
                                      headers: { 'Authorization': `Bearer ${token}` },
                                    })
                                    if (statusResponse.ok) {
                                    const statusData = await statusResponse.json()
                                    console.log(`[DEALS_PAGE] Seed status check ${pollCount}:`, statusData)
                                    
                                    // Check if seed likely completed (data exists but tracking shows running)
                                    const likelyCompleted = statusData.likelyCompleted || (statusData.hasData && !statusData.running)
                                    const isRunning = statusData.running && !likelyCompleted
                                    
                                    setSeedStatus({ running: isRunning, elapsed: statusData.elapsed })
                                    
                                    if (!isRunning || pollCount >= maxPolls) {
                                      clearInterval(pollInterval)
                                      if (!isRunning || likelyCompleted) {
                                        console.log(`[DEALS_PAGE] Seed completed (likelyCompleted: ${likelyCompleted}), refreshing data...`)
                                        await refreshDeals()
                                      }
                                    }
                                    }
                                  } catch (e) {
                                    console.error(`[DEALS_PAGE] Status check error:`, e)
                                    if (pollCount >= maxPolls) {
                                      clearInterval(pollInterval)
                                    }
                                  }
                                }, 5000)
                              } else {
                                setSeedStatus({ running: false })
                                const errorMsg = data.message || data.error || 'Failed to seed data'
                                console.error('[DEALS_PAGE] Seed error:', data)
                                alert(`${errorMsg}\n\nSuggestion: ${data.suggestion || 'Please check server logs for details.'}`)
                              }
                            } catch (err: any) {
                              setSeedStatus({ running: false })
                              console.error('[DEALS_PAGE] Seed error:', err)
                              alert(`Error seeding data: ${err?.message || 'Unknown error'}\n\nPlease check console and server logs.`)
                            }
                          }}
                        >
                          Seed Demo Data
                        </Button>
                        <Dialog open={diagnosticsOpen} onOpenChange={setDiagnosticsOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  if (!token) {
                                    alert('Please log in first')
                                    return
                                  }
                                  console.log(`[DEALS_PAGE] Running seed diagnosis...`)
                                  setDiagnosticsOpen(true)
                                  setDiagnosticsResult('Running diagnosis...')
                                  
                                  const response = await fetch(`/api/admin/seed-diagnosis?tenantId=${encodeURIComponent(tenantId)}`, {
                                    headers: { 'Authorization': `Bearer ${token}` },
                                  })
                                  if (response.ok) {
                                    const diagnostics = await response.json()
                                    console.log(`[DEALS_PAGE] Diagnosis results:`, diagnostics)
                                    
                                    // Format diagnosis results for display
                                    let message = `🔍 Seed Diagnosis Results\n\n`
                                    message += `Timestamp: ${diagnostics.timestamp || new Date().toISOString()}\n`
                                    message += `Tenant ID: ${diagnostics.tenantId}\n\n`
                                    message += `Status: ${diagnostics.summary?.status || 'unknown'}\n`
                                    message += `Checks: ${diagnostics.summary?.passedChecks || 0}/${diagnostics.summary?.totalChecks || 0} passed\n`
                                    message += `Failed: ${diagnostics.summary?.failedChecks || 0}\n`
                                    message += `Warnings: ${diagnostics.summary?.warnings || 0}\n\n`
                                    
                                    if (diagnostics.errors.length > 0) {
                                      message += `❌ ERRORS:\n${diagnostics.errors.map((e: string) => `  • ${e}`).join('\n')}\n\n`
                                    }
                                    
                                    if (diagnostics.warnings.length > 0) {
                                      message += `⚠️ WARNINGS:\n${diagnostics.warnings.map((w: string) => `  • ${w}`).join('\n')}\n\n`
                                    }
                                    
                                    if (diagnostics.recommendations.length > 0) {
                                      message += `💡 RECOMMENDATIONS:\n${diagnostics.recommendations.map((r: string) => `  • ${r}`).join('\n')}\n\n`
                                    }
                                    
                                    // Add check details
                                    message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
                                    message += `DETAILED CHECKS:\n`
                                    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
                                    Object.entries(diagnostics.checks || {}).forEach(([key, check]: [string, any]) => {
                                      const icon = check.status === 'ok' ? '✅' : check.status === 'error' ? '❌' : check.status === 'warning' ? '⚠️' : 'ℹ️'
                                      message += `${icon} ${key.toUpperCase().replace(/([A-Z])/g, (_, c) => ' ' + c).trim()}:\n`
                                      message += `   Status: ${check.status}\n`
                                      message += `   Message: ${check.message}\n`
                                      if (check.error) {
                                        message += `   Error: ${check.error}\n`
                                      }
                                      if (check.errorCode) {
                                        message += `   Error Code: ${check.errorCode}\n`
                                      }
                                      if (check.errorMeta) {
                                        message += `   Error Meta: ${JSON.stringify(check.errorMeta)}\n`
                                      }
                                      if (check.count !== undefined) {
                                        message += `   Count: ${check.count}\n`
                                      }
                                      message += `\n`
                                    })
                                    
                                    // Add JSON for advanced users
                                    message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
                                    message += `RAW JSON (for developers):\n`
                                    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
                                    message += JSON.stringify(diagnostics, null, 2)
                                    
                                    setDiagnosticsResult(message)
                                    
                                    // Also log to console for detailed inspection
                                    console.log(`[DEALS_PAGE] Full diagnosis:`, JSON.stringify(diagnostics, null, 2))
                                  } else {
                                    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
                                    setDiagnosticsResult(`❌ Diagnosis failed:\n\n${error.error || error.message || 'Unknown error'}`)
                                  }
                                } catch (err) {
                                  console.error('Diagnosis error:', err)
                                  setDiagnosticsResult(`❌ Error running diagnosis:\n\n${err instanceof Error ? err.message : String(err)}`)
                                }
                              }}
                            >
                              🔍 Run Diagnosis
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                              <DialogTitle>Seed Diagnosis Results</DialogTitle>
                              <DialogDescription>
                                Copy the results below to share with developers or for troubleshooting
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-hidden flex flex-col">
                              <div className="flex justify-end mb-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (diagnosticsResult) {
                                      navigator.clipboard.writeText(diagnosticsResult).then(() => {
                                        alert('Diagnosis results copied to clipboard!')
                                      }).catch(() => {
                                        alert('Failed to copy. Please select and copy manually.')
                                      })
                                    }
                                  }}
                                >
                                  📋 Copy to Clipboard
                                </Button>
                              </div>
                              <textarea
                                readOnly
                                value={diagnosticsResult || 'Running diagnosis...'}
                                className="flex-1 w-full p-4 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-sm font-mono resize-none"
                                style={{ minHeight: '400px' }}
                                onClick={(e) => {
                                  // Select all text when clicked for easy copying
                                  ;(e.target as HTMLTextAreaElement).select()
                                }}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="outline"
                          onClick={refreshDeals}
                          className="ml-2"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Refreshing...' : 'Refresh Data'}
                        </Button>
                        {seedStatus?.running && (
                          <Button 
                            variant="outline"
                            onClick={() => {
                              refreshDeals()
                              setTimeout(() => window.location.reload(), 1000)
                            }}
                            className="ml-2"
                          >
                            Refresh Page
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Bulk actions + rows per page */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="text-sm text-slate-600 dark:text-gray-400">
                      {selectedDealIds.length > 0 ? (
                        <span>
                          <span className="font-semibold text-slate-900 dark:text-gray-100">{selectedDealIds.length}</span>{' '}
                          selected
                        </span>
                      ) : (
                        <span>
                          Showing <span className="font-semibold text-slate-900 dark:text-gray-100">{pageStart + 1}</span>–
                          <span className="font-semibold text-slate-900 dark:text-gray-100">{pageEnd}</span> of{' '}
                          <span className="font-semibold text-slate-900 dark:text-gray-100">{totalDeals}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-gray-400">Rows per page</span>
                        <select
                          value={rowsPerPage}
                          onChange={(e) => {
                            setRowsPerPage(Number(e.target.value) as any)
                            setUiPage(1)
                          }}
                          className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>

                      <select
                        value={bulkStage}
                        onChange={(e) => setBulkStage(e.target.value)}
                        className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
                        disabled={selectedDealIds.length === 0}
                        title={selectedDealIds.length === 0 ? 'Select deals to enable bulk actions' : undefined}
                      >
                        <option value="">Change stage…</option>
                        <option value="lead">Lead</option>
                        <option value="qualified">Qualified</option>
                        <option value="proposal">Proposal</option>
                        <option value="negotiation">Negotiation</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedDealIds.length === 0 || !bulkStage}
                        onClick={async () => {
                          if (!token) return
                          if (!bulkStage) return
                          if (!confirm(`Change stage for ${selectedDealIds.length} deal(s) to "${bulkStage}"?`)) return
                          try {
                            await Promise.all(
                              selectedDealIds.map(async (dealId) => {
                                const res = await fetch(`/api/deals/${dealId}?tenantId=${encodeURIComponent(tenantId)}`, {
                                  method: 'PATCH',
                                  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ stage: bulkStage }),
                                })
                                if (!res.ok) throw new Error('Stage update failed')
                              })
                            )
                            setSelectedDealIds([])
                            setBulkStage('')
                            queryClient.invalidateQueries({ queryKey: ['deals'] })
                            await refetch()
                          } catch (e) {
                            alert(e instanceof Error ? e.message : 'Bulk update failed')
                          }
                        }}
                      >
                        Apply
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
                        disabled={selectedDealIds.length === 0}
                        onClick={async () => {
                          if (!confirm(`Delete ${selectedDealIds.length} deal(s)? This cannot be undone.`)) return
                          try {
                            await Promise.all(selectedDealIds.map((dealId) => deleteDeal.mutateAsync({ id: dealId, tenantId })))
                            setSelectedDealIds([])
                            queryClient.invalidateQueries({ queryKey: ['deals'] })
                            await refetch()
                          } catch (e) {
                            alert(e instanceof Error ? e.message : 'Bulk delete failed')
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Deals table */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                        <TableRow className="border-b border-slate-200 dark:border-slate-700">
                          <TableHead className="w-10">
                            <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAllOnPage} />
                          </TableHead>
                          <TableHead className="min-w-[220px]">Deal</TableHead>
                          <TableHead className="min-w-[160px]">Contact</TableHead>
                          <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('stage')}>
                            Stage {sortKey === 'stage' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                          </TableHead>
                          <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('value')}>
                            Value {sortKey === 'value' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                          </TableHead>
                          <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('expectedCloseDate')}>
                            Expected Close {sortKey === 'expectedCloseDate' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                          </TableHead>
                          <TableHead className="w-28 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedDeals.map((deal: any) => (
                          <TableRow key={deal.id} className="border-b border-slate-100 dark:border-slate-800">
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedDealIds.includes(deal.id)}
                                onChange={() => {
                                  setSelectedDealIds((prev) =>
                                    prev.includes(deal.id) ? prev.filter((id) => id !== deal.id) : [...prev, deal.id]
                                  )
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <Link href={`/crm/${tenantId}/Deals/${deal.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                                {deal.name}
                              </Link>
                              {deal.expectedCloseDate && (
                                <div className="text-xs text-slate-500 dark:text-gray-400">
                                  {format(new Date(deal.expectedCloseDate), 'MMM dd, yyyy')}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-slate-700 dark:text-gray-300">
                              {deal.contact?.name || deal.contact?.email || '—'}
                            </TableCell>
                            <TableCell className="capitalize text-sm">{deal.stage || 'lead'}</TableCell>
                            <TableCell className="text-sm font-semibold">₹{Number(deal.value ?? 0).toLocaleString('en-IN')}</TableCell>
                            <TableCell className="text-sm">
                              {deal.expectedCloseDate ? format(new Date(deal.expectedCloseDate), 'MMM dd') : '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Link href={`/crm/${tenantId}/Deals/${deal.id}`}>
                                  <Button variant="ghost" size="sm">View</Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(deal.id)}
                                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination controls */}
                  <div className="flex items-center justify-end gap-2 text-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setUiPage(Math.max(1, currentPage - 1))}
                    >
                      Prev
                    </Button>
                    <span className="px-2 text-slate-600 dark:text-gray-400">
                      Page <span className="font-medium text-slate-900 dark:text-gray-100">{currentPage}</span> of{' '}
                      <span className="font-medium text-slate-900 dark:text-gray-100">{pageCount}</span>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= pageCount}
                      onClick={() => setUiPage(Math.min(pageCount, currentPage + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
          </>
        )}
      </div>
    </div>
  )
  } catch (error: any) {
    console.error('[DEALS_PAGE] Component error:', error)
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Deals Page</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error?.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </CardContent>
        </Card>
      </div>
    )
  }
}

