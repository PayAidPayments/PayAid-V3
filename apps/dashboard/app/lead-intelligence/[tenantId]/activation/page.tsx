'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth'
import { getTenantRouteKey } from '@/lib/utils/tenant-route-key'
import {
  tenantHasCommunicationLicense,
  tenantHasCrmLicense,
  tenantHasMarketingLicense,
} from '@/lib/lead-intelligence/tenant-entitlements'
import { LeadIntelligenceSectionPlaceholder } from '@/components/lead-intelligence/LeadIntelligenceSectionPlaceholder'

export default function LeadIntelligenceActivationPage() {
  const tenantId = String(useParams()?.tenantId || '')
  const { tenant } = useAuthStore()
  const licensed = tenant?.licensedModules ?? []
  const hasCrm = tenantHasCrmLicense(licensed)
  const hasMarketing = tenantHasMarketingLicense(licensed)
  const hasComm = tenantHasCommunicationLicense(licensed)
  const routeKey = getTenantRouteKey(tenant) || tenantId
  const billingHref = routeKey ? `/finance/${routeKey}/Billing` : '/dashboard/billing'

  const upsellFooter = !hasCrm ? (
    <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/80 dark:bg-amber-950/30 mt-4">
      <CardHeader className="space-y-1 py-3">
        <CardTitle className="text-base text-amber-950 dark:text-amber-50">Add CRM to activate in-platform</CardTitle>
        <CardDescription className="text-amber-900/90 dark:text-amber-100/85">
          Standalone Lead Intelligence prioritizes CSV/XLSX export. Connecting CRM avoids re-import churn: dedupe previews,
          field mapping, owner assignment, and audit trails inherit provenance captured here.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 pb-4 pt-0">
        <Button asChild variant="default" size="sm">
          <Link href={billingHref}>Add CRM suite</Link>
        </Button>
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-2 mt-4 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-3">
      <p>
        <span className="font-medium text-slate-900 dark:text-slate-50">Licensed for CRM activation.</span> Downstream
        builds will enqueue creates/updates with preview and rollback-friendly batch ids.
      </p>
      {!(hasMarketing && hasComm) ? (
        <p className="text-slate-600 dark:text-slate-300">
          Layer <span className="font-medium">Marketing</span> and <span className="font-medium">Communication</span> to
          unlock sequences, nurture, WhatsApp infra, and dialer handoffs from the same activation queue.
        </p>
      ) : null}
      <p>
        <Link className="text-violet-700 dark:text-violet-300 underline font-medium" href={billingHref}>
          Billing &amp; add-ons
        </Link>
      </p>
    </div>
  )

  return (
    <LeadIntelligenceSectionPlaceholder
      tenantId={tenantId}
      title="Activation queue"
      summary="Move approved prospects into PayAid — CRM Leads first, plus optional Marketing/Communication workflows for outbound — with mandatory dedupe preview and provenance logs."
      plannedItems={[
        'CRM create/update semantics keyed on domain/email where available',
        'Owner assignment, tags, tasks, SLA',
        'Optional campaign/sequence audiences when Marketing is licensed',
        'Messaging / dialing / WhatsApp queues when Communication + telephony tooling is wired',
      ]}
      footer={upsellFooter}
    />
  )
}
