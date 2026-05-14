'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth'
import { LeadIntelligenceM1StepIndicator } from '@/components/lead-intelligence/LeadIntelligenceM1StepIndicator'
import { useLeadIntelligenceM1Progress } from '@/components/lead-intelligence/useLeadIntelligenceM1Progress'

type DiscoveryCompany = {
  id: string
  companyName: string
  industry: string | null
  website: string | null
  location: string | null
  employeeCount: number | null
  source: string
}

export default function LeadIntelligenceCompaniesPage() {
  const tenantId = String(useParams()?.tenantId || '')
  const searchParams = useSearchParams()
  const token = useAuthStore((s) => s.token)
  const q = searchParams.get('q') ?? ''
  const industry = searchParams.get('industry') ?? ''
  const country = searchParams.get('country') ?? ''
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [source, setSource] = useState('')
  const [items, setItems] = useState<DiscoveryCompany[]>([])
  const { completedSteps, markCompleted, resetProgress } = useLeadIntelligenceM1Progress(tenantId)

  const queryText = useMemo(() => {
    const parts = [q && `q: ${q}`, industry && `industry: ${industry}`, country && `country: ${country}`].filter(Boolean)
    return parts.length ? parts.join(' | ') : 'all records'
  }, [q, industry, country])

  async function runDiscovery() {
      if (!token) {
        setLoading(false)
        setError('Missing auth token. Please sign in again.')
        return
      }
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams()
        if (q) params.set('q', q)
        if (industry) params.set('industry', industry)
        if (country) params.set('country', country)
        params.set('limit', '50')

        const response = await fetch(`/api/lead-intelligence/discovery/companies?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || data?.error || `Discovery failed (${response.status})`)
        }
        setItems(Array.isArray(data.items) ? data.items : [])
        setSource(String(data.source || 'unknown'))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load company discovery results.')
      } finally {
        setLoading(false)
      }
    }
  useEffect(() => {
    runDiscovery()
  }, [token, q, industry, country])

  useEffect(() => {
    if (q || industry || country) markCompleted('search')
    if (items.length > 0) markCompleted('companies')
  }, [q, industry, country, items.length, markCompleted])

  return (
    <div className="max-w-6xl space-y-6">
      <LeadIntelligenceM1StepIndicator
        tenantId={tenantId}
        currentStep="companies"
        completedSteps={completedSteps}
        onResetProgress={resetProgress}
      />
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Step 2: Review discovered companies</CardTitle>
          <CardDescription>Current query: {queryText}</CardDescription>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/lead-intelligence/${tenantId}/search`}>Back to Step 1</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/lead-intelligence/${tenantId}/exports?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(industry ? { industry } : {}),
                ...(country ? { country } : {}),
              }).toString()}`}>Go to Step 4 (Export)</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/lead-intelligence/${tenantId}/saved-searches?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(industry ? { industry } : {}),
                ...(country ? { country } : {}),
                resultCount: String(items.length),
              }).toString()}`}>Go to Step 3 (Save search)</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading discovery results...</p>
          ) : error ? (
            <div className="space-y-2">
              <p className="text-sm text-red-600">{error}</p>
              <Button size="sm" variant="outline" onClick={runDiscovery}>
                Retry discovery
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Source: <span className="font-medium">{source || 'n/a'}</span> • Results: {items.length}
              </p>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matching companies found. Broaden your query and retry.</p>
              ) : (
                <div className="overflow-x-auto border rounded-md">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left p-2">Company</th>
                        <th className="text-left p-2">Industry</th>
                        <th className="text-left p-2">Location</th>
                        <th className="text-left p-2">Website</th>
                        <th className="text-right p-2">Employees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2 font-medium">{item.companyName}</td>
                          <td className="p-2">{item.industry || '-'}</td>
                          <td className="p-2">{item.location || '-'}</td>
                          <td className="p-2">{item.website ? <a className="underline" href={item.website} target="_blank" rel="noreferrer">{item.website}</a> : '-'}</td>
                          <td className="p-2 text-right">{item.employeeCount ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
