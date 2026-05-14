'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { LeadIntelligenceM1StepIndicator } from '@/components/lead-intelligence/LeadIntelligenceM1StepIndicator'
import { useLeadIntelligenceM1Progress } from '@/components/lead-intelligence/useLeadIntelligenceM1Progress'

export default function LeadIntelligenceSearchPage() {
  const tenantId = String(useParams()?.tenantId || '')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { completedSteps, markCompleted, resetProgress } = useLeadIntelligenceM1Progress(tenantId)
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [industry, setIndustry] = useState(searchParams.get('industry') ?? '')
  const [country, setCountry] = useState(searchParams.get('country') ?? '')

  const canRun = useMemo(() => q.trim().length > 1 || industry.trim().length > 0 || country.trim().length > 0, [q, industry, country])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canRun) return
    markCompleted('search')
    const next = new URLSearchParams()
    if (q.trim()) next.set('q', q.trim())
    if (industry.trim()) next.set('industry', industry.trim())
    if (country.trim()) next.set('country', country.trim())
    router.push(`/lead-intelligence/${tenantId}/companies?${next.toString()}`)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <LeadIntelligenceM1StepIndicator
        tenantId={tenantId}
        currentStep="search"
        completedSteps={completedSteps}
        onResetProgress={resetProgress}
      />
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Plan discovery</CardTitle>
          <CardDescription>
            Start with filters, then review matched companies, save reusable searches, and export CSV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={onSubmit}>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="q">Search query</Label>
              <Input
                id="q"
                placeholder="e.g. cement distributors, healthcare, logistics"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" placeholder="e.g. Manufacturing" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" placeholder="e.g. India" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={!canRun}>
                Continue to Step 2 (Review companies)
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
