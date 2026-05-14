'use client'

import { useParams } from 'next/navigation'
import { LeadIntelligenceSectionPlaceholder } from '@/components/lead-intelligence/LeadIntelligenceSectionPlaceholder'

export default function LeadIntelligencePeoplePage() {
  const tenantId = String(useParams()?.tenantId || '')
  return (
    <LeadIntelligenceSectionPlaceholder
      tenantId={tenantId}
      title="People discovery"
      summary="Resolve decision-makers linked to discovered accounts with verified contact fields where available."
      plannedItems={[
        'Seniority/title taxonomy and filters',
        'Best-contact heuristic with explainability',
        'Confidence + provider trace per field',
      ]}
    />
  )
}
