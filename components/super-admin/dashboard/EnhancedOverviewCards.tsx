'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Building2,
  Users,
  IndianRupee,
  TrendingDown,
  CreditCard,
  Landmark,
  MessageSquare,
  AlertCircle,
  Activity,
  Zap,
  BarChart3,
  Shield,
} from 'lucide-react'

interface EnhancedOverviewCardsProps {
  totalTenants?: number
  activeTenants?: number
  tenantsThisWeek?: number
  mau?: number
  mauGrowth?: string
  mrr?: number
  mrrGrowth?: string
  arr?: number
  churnRate?: string
  ltvCac?: string
  revenueSources?: {
    card: number
    bank: number
    whatsapp: number
    total: number
  }
  merchantHealth?: {
    newThisWeek: number
    atRisk: number
    highVolume: number
    failedPaymentRate: string
  }
  platformHealth?: {
    apiUptime: number
    whatsappMessages: number
    aiCalls: number
    criticalAlerts: number
  }
  loading?: boolean
}

export function EnhancedOverviewCards({
  totalTenants = 0,
  activeTenants = 0,
  tenantsThisWeek = 0,
  mau = 0,
  mauGrowth = '0',
  mrr = 0,
  mrrGrowth = '0',
  arr = 0,
  churnRate = '0',
  ltvCac = '3.2',
  revenueSources,
  merchantHealth,
  platformHealth,
  loading,
}: EnhancedOverviewCardsProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1_00_000) {
      return `₹${(amount / 1_00_000).toFixed(1)}L`
    }
    return `₹${(amount / 1000).toFixed(0)}K`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Platform KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Merchants
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active: {activeTenants} {tenantsThisWeek > 0 && `| +${tenantsThisWeek}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(mau)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              MAU: {formatNumber(mau)} {mauGrowth !== '0' && `| ${mauGrowth > '0' ? '+' : ''}${mauGrowth}%`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mrr)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {mrrGrowth !== '0' && `${mrrGrowth > '0' ? '+' : ''}${mrrGrowth}%`} | ARR: {formatCurrency(arr)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Churn</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{churnRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              LTV:CAC: {ltvCac}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Revenue Sources */}
      {revenueSources && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Card Payments
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueSources.card)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {revenueSources.total > 0
                  ? `${Math.round((revenueSources.card / revenueSources.total) * 100)}%`
                  : '0%'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bank Transfers
              </CardTitle>
              <Landmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueSources.bank)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {revenueSources.total > 0
                  ? `${Math.round((revenueSources.bank / revenueSources.total) * 100)}%`
                  : '0%'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                WhatsApp Payments
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueSources.whatsapp)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {revenueSources.total > 0
                  ? `${Math.round((revenueSources.whatsapp / revenueSources.total) * 100)}%`
                  : '0%'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Row 3: Merchant Health */}
      {merchantHealth && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New Merchants
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{merchantHealth.newThisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                At Risk
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{merchantHealth.atRisk}</div>
              <p className="text-xs text-muted-foreground mt-1">Low activity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                High Volume
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{merchantHealth.highVolume}</div>
              <p className="text-xs text-muted-foreground mt-1">&gt;₹1L/mo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed Payments
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{merchantHealth.failedPaymentRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Payment failure rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Row 4: Platform Health */}
      {platformHealth && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                API Uptime
              </CardTitle>
              <Zap className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformHealth.apiUptime}%</div>
              <p className="text-xs text-muted-foreground mt-1">System availability</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                WhatsApp Messages
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(platformHealth.whatsappMessages)}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                AI Calls
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(platformHealth.aiCalls)}</div>
              <p className="text-xs text-muted-foreground mt-1">AI interactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Critical Alerts
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformHealth.criticalAlerts}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
