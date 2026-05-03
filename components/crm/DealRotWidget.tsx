'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingDown, Clock } from 'lucide-react'
import Link from 'next/link'
import { useTerms } from '@/lib/terminology/use-terms'

interface RottingDeal {
  id: string
  name: string
  stage: string
  value: number
  daysStuck: number
  lastActivityAt: string | null
  contactId: string | null
  contactName: string | null
  expectedCloseDate: string | null
  suggestedActions: string[]
}

interface DealRotData {
  rottingDeals: RottingDeal[]
  totalCount: number
  byStage: Record<string, number>
  totalValue: number
  totalValueFormatted: string
}

export function DealRotWidget() {
  const { term, pluralTerm } = useTerms()
  const { data, isLoading, error, refetch } = useQuery<{ data: DealRotData }>({
    queryKey: ['deal-rot'],
    queryFn: async () => {
      const response = await apiRequest('/api/crm/deals/rotting')
      if (!response.ok) throw new Error('Failed to fetch rotting deals')
      return response.json()
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  const rottingDeals = data?.data?.rottingDeals || []
  const totalCount = data?.data?.totalCount || 0
  const totalValue = data?.data?.totalValueFormatted || '₹0.00'

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{`${term('deal')} Rot Detection`}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{`${term('deal')} Rot Detection`}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-500">
            {`Error loading rotting ${pluralTerm('deal').toLowerCase()}`}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-green-600" />
            {`${term('deal')} Rot Detection`}
          </CardTitle>
          <CardDescription>{`No rotting ${pluralTerm('deal').toLowerCase()} detected`}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            {`All ${pluralTerm('deal').toLowerCase()} are active and moving forward! 🎉`}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              {`${term('deal')} Rot Detection`}
            </CardTitle>
            <CardDescription>
              {`${totalCount} ${totalCount !== 1 ? pluralTerm('deal').toLowerCase() : term('deal').toLowerCase()} need attention`}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-800 font-medium">Total Rotting</div>
              <div className="text-2xl font-bold text-yellow-900">{totalCount}</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-800 font-medium">At Risk Value</div>
              <div className="text-2xl font-bold text-red-900">{totalValue}</div>
            </div>
          </div>

          {/* Top Rotting Deals */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              Most Urgent ({Math.min(5, rottingDeals.length)})
            </h3>
            <div className="space-y-2">
              {rottingDeals.slice(0, 5).map((deal) => (
                <Link
                  key={deal.id}
                  href={`/dashboard/deals/${deal.id}`}
                  className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{deal.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {deal.contactName && (
                          <span className="mr-2">{`${term('contact')}: ${deal.contactName}`}</span>
                        )}
                        <span className="capitalize">{deal.stage}</span>
                        {' • '}
                        <span className="text-red-600 font-medium">
                          {deal.daysStuck} days stuck
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Value: ₹{deal.value.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-1" />
                  </div>
                  {deal.suggestedActions.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Suggested: {deal.suggestedActions[0]}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* View All Link */}
          {rottingDeals.length > 5 && (
            <div className="pt-2 border-t">
              <Link href="/dashboard/deals?filter=rotting">
                <Button variant="outline" className="w-full">
                  {`View All ${totalCount} Rotting ${pluralTerm('deal')}`}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
