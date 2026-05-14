'use client'

import { useParams } from 'next/navigation'
import { LeadIntelligenceSectionPlaceholder } from '@/components/lead-intelligence/LeadIntelligenceSectionPlaceholder'

export default function LeadIntelligenceScrapingPage() {
  const tenantId = String(useParams()?.tenantId || '')
  return (
    <LeadIntelligenceSectionPlaceholder
      tenantId={tenantId}
      title="Web scraping / URL research"
      summary="Extract structured entities from URLs and directories via templates while respecting robots/policies and tenant guardrails."
      plannedItems={[
        'Extractor templates for teams/directories/events',
        'Row-level confidence + duplicate merge hints',
        'Route approved rows into review or enrichment queues',
      ]}
    />
  )
}
