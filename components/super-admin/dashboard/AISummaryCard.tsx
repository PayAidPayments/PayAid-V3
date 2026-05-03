'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, TrendingUp, TrendingDown, AlertCircle, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface AISummaryCardProps {
  summary?: {
    newMerchants: number
    atRiskMerchants: number
    apiErrorsChange: number
    whatsappUsageChange: number
    revenueChange: number
  }
  loading?: boolean
}

export function AISummaryCard({ summary, loading }: AISummaryCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return null
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(0)}%`
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg">AI Summary (Last 24h)</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-600" />
            <span>
              <strong>{summary.newMerchants}</strong> new merchants
            </span>
          </div>
          {summary.atRiskMerchants > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span>
                <strong>{summary.atRiskMerchants}</strong> at-risk merchant{summary.atRiskMerchants !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {summary.apiErrorsChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-red-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-600" />
            )}
            <span>
              API errors {summary.apiErrorsChange >= 0 ? 'increased' : 'decreased'} by{' '}
              <strong>{Math.abs(summary.apiErrorsChange)}%</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {summary.whatsappUsageChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-gray-400" />
            )}
            <span>
              WhatsApp usage {summary.whatsappUsageChange >= 0 ? 'increased' : 'flat'} by{' '}
              <strong>{Math.abs(summary.whatsappUsageChange)}%</strong>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
