'use client'

import { useParams } from 'next/navigation'
import { AIContentGenerator } from '@/components/marketing/AIContentGenerator'
import { EmailCampaignList } from '@/components/marketing/EmailCampaignList'

export default function MarketingCampaignsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  return (
    <section className="flex-1 space-y-5">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Campaigns</h1>
      <div className="space-y-5">
        <AIContentGenerator organizationId={tenantId} industry="general" />
        <EmailCampaignList organizationId={tenantId} />
      </div>
    </section>
  )
}

