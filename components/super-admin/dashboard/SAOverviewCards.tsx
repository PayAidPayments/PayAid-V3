'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, Users, IndianRupee, Bot } from 'lucide-react'

interface SAOverviewCardsProps {
  totalTenants?: number
  activeTenants?: number
  tenantsThisWeek?: number
  mau?: number
  mauGrowth?: string
  mrr?: number
  mrrGrowth?: string
  arr?: number
  churnRate?: string
  aiUsageCount?: number
  loading?: boolean
}

export function SAOverviewCards({
  totalTenants = 0,
  activeTenants = 0,
  tenantsThisWeek = 0,
  mau = 0,
  mauGrowth = '0',
  mrr = 0,
  mrrGrowth = '0',
  arr = 0,
  churnRate = '0',
  aiUsageCount = 0,
  loading,
}: SAOverviewCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
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
    )
  }

  const cards = [
    {
      title: 'Total Active Tenants',
      value: activeTenants,
      subtitle: tenantsThisWeek > 0 ? `+${tenantsThisWeek} this week` : undefined,
      icon: Building2,
    },
    {
      title: 'Active Users (MAU)',
      value: mau.toLocaleString(),
      subtitle: mauGrowth !== '0' ? `${mauGrowth > '0' ? '+' : ''}${mauGrowth}%` : undefined,
      icon: Users,
    },
    {
      title: 'MRR',
      value: `₹${(mrr / 1000).toFixed(0)}K`,
      subtitle: mrrGrowth !== '0' ? `${mrrGrowth > '0' ? '+' : ''}${mrrGrowth}%` : undefined,
      icon: IndianRupee,
    },
    {
      title: 'ARR',
      value: `₹${(arr / 1_00_000).toFixed(1)}L`,
      subtitle: churnRate !== '0' ? `Churn: ${churnRate}%` : undefined,
      icon: IndianRupee,
    },
    {
      title: 'AI Usage',
      value: aiUsageCount.toLocaleString(),
      icon: Bot,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {c.title}
            </CardTitle>
            <c.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{c.value}</div>
            {c.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{c.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
