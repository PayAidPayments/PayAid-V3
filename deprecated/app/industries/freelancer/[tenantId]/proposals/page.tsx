'use client'

import { useParams } from 'next/navigation'
import { ProposalList } from '@/components/freelancer/ProposalList'

export default function FreelancerProposalsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string

  return (
    <div className="container mx-auto p-6">
      <ProposalList organizationId={tenantId} />
    </div>
  )
}
