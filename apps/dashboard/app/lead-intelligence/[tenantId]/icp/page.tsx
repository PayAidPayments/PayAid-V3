'use client'

import { useParams } from 'next/navigation'
import { LeadIntelligenceSectionPlaceholder } from '@/components/lead-intelligence/LeadIntelligenceSectionPlaceholder'

export default function LeadIntelligenceIcpPage() {
  const tenantId = String(useParams()?.tenantId || '')
  return (
    <LeadIntelligenceSectionPlaceholder
      tenantId={tenantId}
      title="ICP Builder"
      summary="Persist ideal-customer profiles (industry, geo, firmographics, technographics, hiring/funding signals, exclusions) used to steer discovery and fit scoring."
      plannedItems={[
        'Weighted priority rules and persona templates',
        'Prompt→ICP drafting assistant (optional)',
        'Versioned ICP snapshots linked to saved searches',
      ]}
    />
  )
}
