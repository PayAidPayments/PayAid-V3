'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowRight, Building2, CheckCircle2, Filter, Mail, Phone, Target, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const mockPipeline = [
  {
    title: '1) Build ICP Brief',
    description: 'Define industry, geo, company-size, personas, and exclusions.',
    status: 'Ready',
    icon: Filter,
  },
  {
    title: '2) Discover Companies',
    description: 'Run company-first discovery and rank accounts by fit + signals.',
    status: 'Ready',
    icon: Building2,
  },
  {
    title: '3) Resolve Contacts',
    description: 'Find decision-makers and enrich email, phone, LinkedIn, and website.',
    status: 'Ready',
    icon: Users,
  },
  {
    title: '4) Score + Activate',
    description: 'Prioritize by conversion potential and push approved records to CRM.',
    status: 'Ready',
    icon: Target,
  },
]

const sampleFields = [
  { label: 'Full Name', icon: Users },
  { label: 'Work Email', icon: Mail },
  { label: 'Phone Number', icon: Phone },
  { label: 'LinkedIn Profile', icon: CheckCircle2 },
  { label: 'Website', icon: Building2 },
]

export default function LeadGeneratorPage() {
  const params = useParams()
  const tenantId = String(params?.tenantId || '')

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Lead Generator (Lead Intelligence)</CardTitle>
            <CardDescription>
              Company-first lead intelligence workspace to shortlist high-fit prospects and activate into pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/crm/${tenantId}/Leads`}>
                Open Prospects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/crm/${tenantId}/Leads/New`}>Add Prospect Manually</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {mockPipeline.map((step) => {
            const Icon = step.icon
            return (
              <Card key={step.title}>
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-blue-600" />
                      <CardTitle className="text-base">{step.title}</CardTitle>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                      {step.status}
                    </span>
                  </div>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Intelligence Fields</CardTitle>
            <CardDescription>
              These are the key prospect details exposed in this module for review before activation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sampleFields.map((field) => {
                const Icon = field.icon
                return (
                  <div
                    key={field.label}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm"
                  >
                    <Icon className="h-4 w-4 text-slate-600" />
                    <span>{field.label}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
