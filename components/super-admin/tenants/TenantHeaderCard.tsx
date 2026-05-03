'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Calendar, Globe, CreditCard } from 'lucide-react'
import { format } from 'date-fns'

interface TenantHeaderCardProps {
  name: string
  subdomain: string | null
  status: string
  plan: string | null
  subscriptionTier: string | null
  createdAt: string
}

export function TenantHeaderCard({
  name,
  subdomain,
  status,
  plan,
  subscriptionTier,
  createdAt,
}: TenantHeaderCardProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default'
      case 'suspended':
        return 'destructive'
      case 'trial':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getPlanBadgeVariant = (tier: string | null) => {
    if (!tier) return 'outline'
    switch (tier.toLowerCase()) {
      case 'enterprise':
        return 'default'
      case 'growth':
        return 'secondary'
      case 'starter':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-2xl">{name}</CardTitle>
              {subdomain && (
                <div className="flex items-center gap-2 mt-1">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {subdomain}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
            {subscriptionTier && (
              <Badge variant={getPlanBadgeVariant(subscriptionTier)}>
                {plan || subscriptionTier}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
              <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {format(new Date(createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          {subscriptionTier && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
                <CreditCard className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Plan</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {plan || subscriptionTier}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
