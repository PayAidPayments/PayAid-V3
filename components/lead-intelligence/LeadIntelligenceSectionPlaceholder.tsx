'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LeadIntelligenceSectionPlaceholder(props: {
  tenantId: string
  title: string
  summary: string
  plannedItems: string[]
  /** Optional entitlement / upsell callouts above actions */
  footer?: ReactNode
}) {
  const { tenantId, title, summary, plannedItems, footer } = props
  const crmLeads = `/crm/${tenantId}/Leads`

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">{title}</CardTitle>
            <Badge variant="secondary">In development</Badge>
          </div>
          <CardDescription>{summary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <p>
            This screen is part of the standalone Lead Intelligence module. No sample or static “live” results are
            shown here yet; backend discovery, enrichment, and activation will wire in per phase.
          </p>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100 mb-2">Planned capabilities</p>
            <ul className="list-disc pl-5 space-y-1">
              {plannedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          {footer}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/lead-intelligence/${tenantId}/Home`}>Module home</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={crmLeads}>CRM Prospects (activated records)</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
