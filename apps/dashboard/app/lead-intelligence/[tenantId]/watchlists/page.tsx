'use client'

import { useParams } from 'next/navigation'
import { LeadIntelligenceSectionPlaceholder } from '@/components/lead-intelligence/LeadIntelligenceSectionPlaceholder'

export default function LeadIntelligenceWatchlistsPage() {
  const tenantId = String(useParams()?.tenantId || '')
  return (
    <LeadIntelligenceSectionPlaceholder
      tenantId={tenantId}
      title="Watchlists"
      summary="Scheduled re-runs of saved criteria with configurable enrichment and optional auto-route to review/activation."
      plannedItems={[
        'Cadence presets (daily/weekly/monthly)',
        'Budget caps per watchlist run',
        'Alerting net-new discoveries',
      ]}
    />
  )
}
