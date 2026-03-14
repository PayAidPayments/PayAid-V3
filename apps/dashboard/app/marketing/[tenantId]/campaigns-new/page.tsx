'use client'

import { useParams } from 'next/navigation'
import { EmailCampaignList } from '@/components/marketing/EmailCampaignList'
import { AIContentGenerator } from '@/components/marketing/AIContentGenerator'

export default function CampaignsPageNew() {
  const params = useParams()
  const tenantId = params.tenantId as string

  return (
    <div className="container mx-auto p-6 space-y-6">
      <AIContentGenerator organizationId={tenantId} industry="general" />
      <EmailCampaignList organizationId={tenantId} />
    </div>
  )
}
