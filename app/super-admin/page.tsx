'use client'

import { useEffect, useState } from 'react'
import { EnhancedOverviewCards } from '@/components/super-admin/dashboard/EnhancedOverviewCards'
import { SAModuleAdoptionChart } from '@/components/super-admin/dashboard/SAModuleAdoptionChart'
import { SAAIUsageChart } from '@/components/super-admin/dashboard/SAAIUsageChart'
import { SAAnomaliesCard } from '@/components/super-admin/dashboard/SAAnomaliesCard'
import { AISummaryCard } from '@/components/super-admin/dashboard/AISummaryCard'
import { RecentChangesFeed } from '@/components/super-admin/dashboard/RecentChangesFeed'
import { TopErrorsCard } from '@/components/super-admin/dashboard/TopErrorsCard'
import { OnboardingFunnelChart } from '@/components/super-admin/dashboard/OnboardingFunnelChart'
import { useSAOverview } from '@/lib/hooks/super-admin/useSAOverview'
import { Button } from '@/components/ui/button'
import { Plus, Download, Users } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export default function SuperAdminOverviewPage() {
  const { data, loading, error, fetchStats } = useSAOverview()
  const [enhancedData, setEnhancedData] = useState<{
    aiSummary?: any
    topErrors?: any[]
    recentChanges?: any[]
    onboardingFunnel?: any[]
  } | null>(null)
  const [enhancedLoading, setEnhancedLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchEnhancedData()
  }, [fetchStats])

  const fetchEnhancedData = async () => {
    setEnhancedLoading(true)
    try {
      const res = await fetch('/api/super-admin/overview-enhanced')
      if (res.ok) {
        const json = await res.json()
        setEnhancedData(json)
      }
    } catch (error) {
      console.error('Failed to fetch enhanced data:', error)
    } finally {
      setEnhancedLoading(false)
    }
  }

  // Debug log
  useEffect(() => {
    if (data) {
      console.log('[SuperAdminOverviewPage] Data received:', data)
    }
    if (error) {
      console.error('[SuperAdminOverviewPage] Error:', error)
    }
  }, [data, error])

  const moduleAdoption =
    data?.totalTenants != null
      ? [
          { module: 'crm', tenants: Math.max(0, Math.floor((data.totalTenants ?? 0) * 0.8)) },
          { module: 'finance', tenants: Math.max(0, Math.floor((data.totalTenants ?? 0) * 0.6)) },
          { module: 'marketing', tenants: Math.max(0, Math.floor((data.totalTenants ?? 0) * 0.4)) },
          { module: 'hr', tenants: Math.max(0, Math.floor((data.totalTenants ?? 0) * 0.3)) },
          { module: 'ai-cofounder', tenants: Math.max(0, data.aiUsageCount ?? 0) },
        ]
      : []

  const aiUsageData = [
    { label: 'Calls / sessions', value: data?.aiUsageCount ?? 0 },
    { label: 'Conversations', value: Math.floor((data?.aiUsageCount ?? 0) / 2) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Overview</h1>
          <p className="text-muted-foreground">
            Platform-wide metrics and health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/super-admin/merchants"
            className="inline-flex items-center justify-center rounded-lg text-sm font-semibold px-3 py-1.5 text-xs border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            <Users className="h-4 w-4 mr-2" />
            New Merchant
          </Link>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Link
            href="/crm"
            className="inline-flex items-center justify-center rounded-lg text-sm font-semibold px-3 py-1.5 text-xs border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            View PayAid Payments
          </Link>
        </div>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            <strong>Error loading dashboard:</strong> {error}
          </p>
          <button
            onClick={() => fetchStats()}
            className="mt-2 text-sm text-red-600 underline"
          >
            Retry
          </button>
        </div>
      )}
      {/* Band 1: Global KPIs + AI Summary */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
        <div className="md:col-span-4 lg:col-span-4">
          <EnhancedOverviewCards
            totalTenants={data?.totalTenants}
            activeTenants={data?.activeTenants}
            tenantsThisWeek={data?.tenantsThisWeek}
            mau={data?.mau}
            mauGrowth={data?.mauGrowth}
            mrr={data?.mrr}
            mrrGrowth={data?.mrrGrowth}
            arr={data?.arr}
            churnRate={data?.churnRate}
            revenueSources={data?.revenueSources}
            merchantHealth={data?.merchantHealth}
            platformHealth={data?.platformHealth}
            loading={loading}
          />
        </div>
        <div className="md:col-span-4 lg:col-span-1">
          <AISummaryCard summary={enhancedData?.aiSummary} loading={enhancedLoading} />
        </div>
      </div>

      {/* Band 2: Revenue & Merchant Health - Make cards clickable */}
      {data?.merchantHealth && (
        <div className="grid gap-4 md:grid-cols-4">
          <Link href="/super-admin/business/merchants?filter=new">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">New Merchants</div>
                <div className="text-2xl font-bold">{data.merchantHealth.newThisWeek}</div>
                <div className="text-xs text-muted-foreground mt-1">This week</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/super-admin/business/merchants?filter=at-risk">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">At Risk</div>
                <div className="text-2xl font-bold text-orange-600">{data.merchantHealth.atRisk}</div>
                <div className="text-xs text-muted-foreground mt-1">Requires attention</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/super-admin/business/merchants?filter=high-volume">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">High Volume</div>
                <div className="text-2xl font-bold">{data.merchantHealth.highVolume}</div>
                <div className="text-xs text-muted-foreground mt-1">Active merchants</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/super-admin/revenue/payments?filter=failed">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Failed Payments</div>
                <div className="text-2xl font-bold text-red-600">{data.merchantHealth.failedPaymentRate}%</div>
                <div className="text-xs text-muted-foreground mt-1">Failure rate</div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Band 3: Platform Health & AI */}
      <div className="grid gap-6 md:grid-cols-2">
        <TopErrorsCard errors={enhancedData?.topErrors} loading={enhancedLoading} />
        <RecentChangesFeed changes={enhancedData?.recentChanges} loading={enhancedLoading} />
      </div>

      {/* Band 4: Module Adoption & Funnels */}
      <div className="grid gap-6 md:grid-cols-2">
        <SAModuleAdoptionChart data={moduleAdoption} loading={loading} />
        <SAAIUsageChart data={aiUsageData} loading={loading} />
      </div>
      <OnboardingFunnelChart data={enhancedData?.onboardingFunnel} loading={enhancedLoading} />
      <SAAnomaliesCard items={[]} loading={loading} />
      {data?.recentActivity && data.recentActivity.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Recent Activity (Last 24h)</h3>
          <div className="space-y-2">
            {data.recentActivity.map((activity: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 text-sm py-2 border-b last:border-0">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-muted-foreground">
                  {activity.type === 'tenant_created' && (
                    <>
                      <span className="font-medium">{activity.name}</span> created ({activity.tier})
                    </>
                  )}
                  {activity.type === 'user_invited' && (
                    <>
                      <span className="font-medium">{activity.name || activity.email}</span> invited
                      to {activity.tenant}
                    </>
                  )}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
