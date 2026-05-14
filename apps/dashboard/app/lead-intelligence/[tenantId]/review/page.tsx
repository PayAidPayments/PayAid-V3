'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { LeadIntelligenceSectionPlaceholder } from '@/components/lead-intelligence/LeadIntelligenceSectionPlaceholder'
import { Button } from '@/components/ui/button'

export default function LeadIntelligenceReviewPage() {
  const tenantId = String(useParams()?.tenantId || '')
  return (
    <LeadIntelligenceSectionPlaceholder
      tenantId={tenantId}
      title="Review queue"
      summary="Human approval before export or activation: duplicates, conflicts, missing fields, and low-confidence fields surface here with approve / reject / request re-enrichment."
      plannedItems={[
        'Row-level disposition with reviewer and notes',
        'Threshold rules (minimum score/confidence before activation)',
        'Merge-duplicate tooling with provenance-preserving resolution',
      ]}
      footer={
        <div className="rounded-md border border-slate-200 bg-slate-50/90 p-3 dark:border-slate-700 dark:bg-slate-900/40 space-y-2">
          <p className="font-medium text-slate-900 dark:text-slate-50">Meanwhile (M1)</p>
          <p>
            Approval queues are planned for enrichment and activation readiness. Until then, export-first discovery runs
            from Search → Companies → Saved searches → CSV exports.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/lead-intelligence/${tenantId}/search`}>Open Search</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/lead-intelligence/${tenantId}/companies`}>Open Companies</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/lead-intelligence/${tenantId}/exports`}>Open Exports</Link>
            </Button>
          </div>
        </div>
      }
    />
  )
}
