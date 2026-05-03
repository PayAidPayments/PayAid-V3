'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { CampaignDetailPayload } from '@/lib/marketing/campaign-detail-payload'
import { CampaignDetailHeader } from './CampaignDetailHeader'
import { CampaignKpiGrid } from './CampaignKpiGrid'
import { CampaignDetailTabs } from './CampaignDetailTabs'

function CampaignDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-6">
      <Skeleton className="h-10 w-2/3 max-w-xl" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  )
}

export default function MarketingCampaignDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const { token } = useAuthStore()
  const queryClient = useQueryClient()
  const [campaignTab, setCampaignTab] = useState('overview')

  const { data: payload, isLoading, isError, error } = useQuery<CampaignDetailPayload>({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const response = await fetch(`/api/marketing/campaigns/${id}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) throw new Error('Failed to fetch campaign')
      return response.json()
    },
  })

  const sendCampaign = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/marketing/campaigns/${id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Failed to send campaign')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      alert('Campaign queued for sending.')
    },
  })

  const onSend = () => {
    if (!payload) return
    if (
      confirm(
        `Send this campaign to ${payload.summary.audienceCount.toLocaleString()} recipients?`
      )
    ) {
      sendCampaign.mutate()
    }
  }

  if (isLoading) {
    return <CampaignDetailSkeleton />
  }

  if (isError || !payload) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 py-12 text-center space-y-4">
        <p className="text-slate-600 dark:text-slate-400">
          {error instanceof Error ? error.message : 'Campaign not found'}
        </p>
        <Link href={`/marketing/${tenantId}/Campaigns`}>
          <Button variant="outline">Back to campaigns</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-6 md:space-y-8">
      <CampaignDetailHeader
        tenantId={tenantId}
        payload={payload}
        sendPending={sendCampaign.isPending}
        onSend={onSend}
        onRetry={onSend}
      />
      <CampaignKpiGrid payload={payload} />
      <CampaignDetailTabs payload={payload} activeTab={campaignTab} onTabChange={setCampaignTab} />
    </div>
  )
}
