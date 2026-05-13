'use client'

import { useParams } from 'next/navigation'
import { LeadIntelligenceSectionPlaceholder } from '@/components/lead-intelligence/LeadIntelligenceSectionPlaceholder'

export default function LeadIntelligenceScoringPage() {
  const tenantId = String(useParams()?.tenantId || '')
  return (
    <LeadIntelligenceSectionPlaceholder
      tenantId={tenantId}
      title="Qualification & scoring"
      summary="ICP-fit, completeness, intent, freshness, contactability tiers with explainability and thresholds for downstream automation."
      plannedItems={[
        'Configurable weights per ICP',
        'Explain panel ("why this score")',
        'Auto-segments A/B/C and review routing rules',
      ]}
    />
  )
}
