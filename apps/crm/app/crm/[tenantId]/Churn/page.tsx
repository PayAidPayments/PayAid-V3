'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/ui/loading'
import { AlertTriangle, TrendingDown, Users, MessageCircle } from 'lucide-react'

const INDIAN_CURRENCY = '₹'

export default function ChurnDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  const { data, isLoading, error } = useQuery({
    queryKey: ['churn-dashboard', tenantId],
    queryFn: async () => {
      const res = await apiRequest('/api/crm/churn/dashboard')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: !!tenantId,
  })

  if (!tenantId) return <PageLoading message="Loading..." fullScreen={false} />
  if (isLoading) return <PageLoading message="Loading churn dashboard..." fullScreen={false} />
  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400">
        Failed to load churn dashboard.
      </div>
    )
  }

  const atRisk = data.contacts?.filter((c: { churnRiskScore: number }) => c.churnRiskScore >= 40) ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Churn Predictor</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          At-risk customers and recommended actions. All amounts in ₹ INR.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              High risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{data.segments?.high ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-500" />
              Medium risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{data.segments?.medium ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Revenue at risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {INDIAN_CURRENCY}{(data.revenueAtRiskInr ?? 0).toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>At-risk contacts</CardTitle>
          <CardDescription>Score ≥ 40. Use actions to retain.</CardDescription>
        </CardHeader>
        <CardContent>
          {atRisk.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No at-risk customers.</p>
          ) : (
            <div className="space-y-3">
              {atRisk.map((c: { id: string; name: string; company?: string; churnRiskScore: number; churnReasonSummary?: string; recommendedAction?: string; dealValueAtRisk?: number }) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 dark:border-gray-700"
                >
                  <div>
                    <Link href={`/crm/${tenantId}/Contacts/${c.id}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                      {c.name}
                    </Link>
                    {c.company && <span className="text-sm text-gray-500 ml-2">{c.company}</span>}
                    {c.churnReasonSummary && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{c.churnReasonSummary}</p>}
                    {c.recommendedAction && <p className="text-sm text-green-700 dark:text-green-400 mt-0.5">{c.recommendedAction}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {c.dealValueAtRisk != null && c.dealValueAtRisk > 0 && (
                      <span className="text-sm">{INDIAN_CURRENCY}{c.dealValueAtRisk.toLocaleString('en-IN')}</span>
                    )}
                    <Badge variant={c.churnRiskScore >= 70 ? 'destructive' : 'secondary'}>{c.churnRiskScore} risk</Badge>
                    <Link href={`/crm/${tenantId}/Contacts/${c.id}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                    <Link href={`/crm/${tenantId}/Tasks/new?contactId=${c.id}`}>
                      <Button size="sm">Task</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
