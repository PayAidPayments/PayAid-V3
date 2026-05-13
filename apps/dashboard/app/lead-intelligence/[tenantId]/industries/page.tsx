'use client'

import { useParams } from 'next/navigation'
import { LeadIntelligenceSectionPlaceholder } from '@/components/lead-intelligence/LeadIntelligenceSectionPlaceholder'

export default function LeadIntelligenceIndustriesPage() {
  const tenantId = String(useParams()?.tenantId || '')
  return (
    <LeadIntelligenceSectionPlaceholder
      tenantId={tenantId}
      title="Industry explorer"
      summary="Browse 100+ verticals with seeded prompts, common decision-maker paths, suggested signals, and starter workflows."
      plannedItems={[
        'Industry → prefilled ICP + sample searches',
        'Recommended sources per vertical',
        'One-click saved lead-pack templates',
      ]}
    />
  )
}
