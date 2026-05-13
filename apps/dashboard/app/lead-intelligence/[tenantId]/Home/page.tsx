'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Database, Download, ListChecks, Radar, Workflow } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { getTenantRouteKey } from '@/lib/utils/tenant-route-key'
import {
  tenantHasCrmLicense,
  tenantHasCommunicationLicense,
  tenantHasMarketingLicense,
} from '@/lib/lead-intelligence/tenant-entitlements'

export default function LeadIntelligenceHomePage() {
  const params = useParams()
  const tenantId = String(params?.tenantId || '')
  const { tenant } = useAuthStore()
  const licensed = tenant?.licensedModules ?? []
  const hasCrm = tenantHasCrmLicense(licensed)
  const hasMarketing = tenantHasMarketingLicense(licensed)
  const hasComm = tenantHasCommunicationLicense(licensed)
  const tenantRouteKey = getTenantRouteKey(tenant) || tenantId
  const billingHref = tenantRouteKey ? `/finance/${tenantRouteKey}/Billing` : '/dashboard/billing'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Lead Intelligence</h1>
          <Badge variant="secondary">Product shell</Badge>
          {hasCrm ? (
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 dark:text-emerald-400">
              CRM activation available
            </Badge>
          ) : (
            <Badge variant="outline">Export-first / activate with add-ons</Badge>
          )}
        </div>
        <p className="text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          Sellable standalone prospecting: discover, enrich, and qualify in this module, then{' '}
          <span className="font-medium text-slate-800 dark:text-slate-100">download CSV/XLSX</span> and use the data anywhere.
          Customers who only export are valid — it is deliberate market entry. Activating rows into{' '}
          <span className="font-medium text-slate-800 dark:text-slate-100">
            CRM, messaging, sequences, dialing, WhatsApp, and appointments
          </span>{' '}
          is an optional PayAid expansion that removes duplicate imports and keeps provenance intact.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 text-violet-600">
              <Radar className="h-5 w-5" />
              <CardTitle className="text-base">Discover</CardTitle>
            </div>
            <CardDescription>
              Prompts, ICP, and parallel connector plans replace one-off spreadsheets as the upstream source of truth.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href={`/lead-intelligence/${tenantId}/search`}>Search</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600">
              <Database className="h-5 w-5" />
              <CardTitle className="text-base">Enrich &amp; qualify</CardTitle>
            </div>
            <CardDescription>Verification, tiers, scoring, provenance — no fake “live” mocks in this shell.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/lead-intelligence/${tenantId}/enrichment`}>Enrichment</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/lead-intelligence/${tenantId}/scoring`}>Scoring</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/lead-intelligence/${tenantId}/review`}>Review</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-600">
              <Workflow className="h-5 w-5" />
              <CardTitle className="text-base">Distribute</CardTitle>
            </div>
            <CardDescription>Exports stay first-class; platform activation stays one click away when subscribed.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/lead-intelligence/${tenantId}/exports`} className="inline-flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Exports
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/lead-intelligence/${tenantId}/activation`}>Activation</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border border-violet-200 bg-violet-50/70 dark:border-violet-900 dark:bg-violet-950/25 px-4 py-3 flex flex-wrap items-center gap-2 md:gap-3">
        <div className="flex items-center gap-2 text-violet-800 dark:text-violet-200">
          <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
          <span className="text-sm font-medium">Shipped today: company discovery M1</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/lead-intelligence/${tenantId}/search`}>Step 1 — Search</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/lead-intelligence/${tenantId}/companies`}>Step 2 — Companies</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/lead-intelligence/${tenantId}/saved-searches`}>Step 3 — Saved</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/lead-intelligence/${tenantId}/exports`}>Step 4 — Exports</Link>
          </Button>
        </div>
      </div>

      {!hasCrm ? (
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/80 dark:bg-amber-950/30">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base text-amber-950 dark:text-amber-50">Upsell path: CRM &amp; pipeline</CardTitle>
            <CardDescription className="text-amber-900/90 dark:text-amber-100/85">
              You can run Lead Intelligence without CRM — export and leave. Adding CRM unlocks mapped activation, dedupe
              against existing pipeline, owner routing, deals, tasks, and follow-up automation inside PayAid.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="default" size="sm">
              <Link href={billingHref}>Review plans / add CRM</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/register?bundle=lead-intelligence">
                New signup: Lead Intelligence only
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/register?bundle=lead-intelligence-with-crm">
                New signup: Lead Intelligence + CRM bundle
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">CRM boundary</CardTitle>
            <CardDescription>
              CRM Prospects are for activated records — not bulk market discovery. Use exports or activation queues here,
              then work deals and activities in CRM.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/crm/${tenantId}/Leads`}>Open CRM Prospects</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/lead-intelligence/${tenantId}/activation`}>Open activation queue</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!hasMarketing || !hasComm ? (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base text-slate-900 dark:text-slate-50">Expand: communications &amp; campaigns</CardTitle>
            <CardDescription>
              After CRM, layering Marketing / Communication unlocks outbound activation (sequences, nurture, WhatsApp
              infra) tied to provenance from Lead Intelligence once those connectors ship.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={billingHref}>{!hasMarketing || !hasComm ? 'Add modules' : 'Billing'}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
