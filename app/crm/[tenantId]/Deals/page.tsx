'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useDeals, useDeleteDeal } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format, isThisMonth, isPast, startOfMonth, endOfMonth, isWithinInterval, startOfYear, endOfYear, startOfQuarter, endOfQuarter, isThisYear, isThisQuarter } from 'date-fns'
import { Briefcase, TrendingUp, CheckCircle2, XCircle, Calendar, DollarSign, AlertCircle, Filter } from 'lucide-react'
// ModuleTopBar is now in layout.tsx
import { PageLoading } from '@/components/ui/loading'

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
  const params = useParams()
  const searchParams = useSearchParams()
  const tenantId = params?.tenantId as string
  const [page, setPage] = useState(1)
  const [stageFilter, setStageFilter] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'financial-year' | 'year'>('month')
  const { data, isLoading } = useDeals({ page, limit: 1000, stage: stageFilter || undefined })
  const deleteDeal = useDeleteDeal()

  // Handle URL query parameters
  useEffect(() => {
    const category = searchParams?.get('category')
    const filter = searchParams?.get('filter') // Support old format
    const timePeriodParam = searchParams?.get('timePeriod')
    const period = searchParams?.get('period') // Support old format
    
    // Use category if available, otherwise fall back to filter
    const selectedFilter = category || filter
    if (selectedFilter) {
      setSelectedCategory(selectedFilter)
    }
    
    // Use timePeriod if available, otherwise fall back to period
    const selectedPeriod = timePeriodParam || period
    if (selectedPeriod && ['month', 'quarter', 'financial-year', 'year'].includes(selectedPeriod)) {
      setTimePeriod(selectedPeriod as 'month' | 'quarter' | 'financial-year' | 'year')
    }
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

  // Get time period boundaries based on selected period
  const getTimePeriodBounds = () => {
    const now = new Date()
    
    switch (timePeriod) {
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: 'This Month'
        }
      case 'quarter':
        return {
          start: startOfQuarter(now),
          end: endOfQuarter(now),
          label: 'This Quarter'
        }
      case 'financial-year':
        // Financial year in India runs from April 1 to March 31
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() // 0-indexed (0=Jan, 3=Apr, 11=Dec)
        // If current month is Jan-Mar (0-2), FY started in previous year's April
        // If current month is Apr-Dec (3-11), FY started in current year's April
        const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1
        const fyEndYear = fyStartYear + 1
        return {
          start: new Date(fyStartYear, 3, 1), // April 1
          end: new Date(fyEndYear, 2, 31, 23, 59, 59, 999), // March 31
          label: 'This Financial Year'
        }
      case 'year':
        return {
          start: startOfYear(now),
          end: endOfYear(now),
          label: 'This Year'
        }
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: 'This Month'
        }
    }
  }

  // Categorize deals
  const categorizedDeals = useMemo(() => {
    if (!data?.deals) return {
      created: [],
      closing: [],
      won: [],
      lost: [],
      allWon: [],
      allLost: [],
      byStage: {} as Record<string, any[]>,
      all: []
    }

    const period = getTimePeriodBounds()
    const periodStart = period.start
    const periodEnd = period.end

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
        // Won in period - prioritize closedAt, then updatedAt, then createdAt
        // Only use createdAt if the deal was created and won in the same period (unlikely but possible)
        const closedDate = deal.closedAt || deal.updatedAt || (deal.createdAt && deal.stage === 'won' ? deal.createdAt : null)
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
    const period = getTimePeriodBounds()
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

  if (isLoading) {
    return <PageLoading message="Loading deals..." fullScreen={false} />
  }

  const deals = data?.deals || []

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
        {selectedCategory && displayedDeals && (
          <div className="space-y-4">
            {displayedDeals.length > 0 ? (
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
                    {displayedDeals.map((deal: any) => (
                      <DealRow key={deal.id} deal={deal} tenantId={tenantId} onDelete={handleDelete} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 mb-2">No deals found in this category</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    Show All Deals
                  </Button>
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
                  <Link href={`/crm/${tenantId}/Deals/new`}>
                    <Button>Create Your First Deal</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {deals.map((deal: any) => (
                    <DealRow key={deal.id} deal={deal} tenantId={tenantId} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

