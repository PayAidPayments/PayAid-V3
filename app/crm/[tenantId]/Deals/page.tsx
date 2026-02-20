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
import { Briefcase, TrendingUp, CheckCircle2, XCircle, Calendar, DollarSign, AlertCircle, Filter } from 'lucide-react'
// ModuleTopBar is now in layout.tsx
import { PageLoading } from '@/components/ui/loading'
import { getTimePeriodBounds, validateFilterParams, type DealCategory, type TimePeriod } from '@/lib/utils/crm-filters'

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
    const [page, setPage] = useState(1)
    const [stageFilter, setStageFilter] = useState<string>('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'financial-year' | 'year'>('month')
    const queryClient = useQueryClient()
    // Use bypassCache on initial load to ensure fresh data after seeding.
    // Pass tenantId from the route so the API returns deals for the tenant we're viewing.
    const { data, isLoading, error: dealsError, refetch } = useDeals({ 
      page, 
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
        await deleteDeal.mutateAsync(id)
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
    <div className="w-full bg-gray-50 dark:bg-gray-900 relative" style={{ zIndex: 1 }}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Deals</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your sales deals and pipeline</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30">
              <Filter className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <select
                value={timePeriod}
                onChange={(e) => {
                  setTimePeriod(e.target.value as 'month' | 'quarter' | 'financial-year' | 'year')
                  setSelectedCategory(null) // Reset filter when period changes
                }}
                className="text-sm font-medium text-purple-700 dark:text-purple-300 bg-transparent border-0 focus:outline-none cursor-pointer"
              >
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="financial-year">This Financial Year</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <Link href={`/crm/${tenantId}/Deals/new`}>
              <Button>New Deal</Button>
            </Link>
          </div>
        </div>

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
                                      message += `${icon} ${key.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}:\n`
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
                    setPage(1)
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
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No deals found</p>
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
                                      message += `${icon} ${key.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}:\n`
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
                <div className="space-y-2">
                  {Array.isArray(deals) ? deals.map((deal: any) => (
                    <DealRow key={deal.id} deal={deal} tenantId={tenantId} onDelete={handleDelete} />
                  )) : (
                    <p className="text-gray-600 dark:text-gray-400">Deals data is not in the expected format</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
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

