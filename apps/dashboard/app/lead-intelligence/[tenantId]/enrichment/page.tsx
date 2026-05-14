'use client'

import { useParams } from 'next/navigation'
import { LeadIntelligenceSectionPlaceholder } from '@/components/lead-intelligence/LeadIntelligenceSectionPlaceholder'

export default function LeadIntelligenceEnrichmentPage() {
  const tenantId = String(useParams()?.tenantId || '')
  return (
    <LeadIntelligenceSectionPlaceholder
      tenantId={tenantId}
      title="Enrichment center"
      summary="CSV uploads or in-product selections with presets (email-only, phone-only, deep firmographic stack) and metering."
      plannedItems={[
        'Preset library + mapping UI',
        'Cost/credits estimate prior to commit',
        'Job status, fill-rate, and failure attribution',
      ]}
    />
  )
}
