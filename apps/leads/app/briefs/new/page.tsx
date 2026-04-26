'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface CreateBriefResponse {
  item?: { id: string; name: string }
  run?: { segmentId: string; jobId: string }
  error?: string
}

type WizardStep = 1 | 2 | 3 | 4 | 5

interface BriefDraft {
  tenantId: string
  createdById: string
  name: string
  description: string
  prompt: string
  industries: string
  geos: string
  sizes: string
  personas: string
  tech: string
  triggers: string
  exclusions: string
  autoRun: boolean
}

const AUTOSAVE_KEY = 'leads-brief-wizard-draft-v1'

const DEFAULT_DRAFT: BriefDraft = {
  tenantId: '',
  createdById: 'system',
  name: '',
  description: '',
  prompt: '',
  industries: '',
  geos: '',
  sizes: '',
  personas: '',
  tech: '',
  triggers: '',
  exclusions: '',
  autoRun: true,
}

function parseCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function NewLeadBriefPage() {
  const [step, setStep] = useState<WizardStep>(1)
  const [draft, setDraft] = useState<BriefDraft>(DEFAULT_DRAFT)
  const [loadedAutosave, setLoadedAutosave] = useState(false)
  const [autosaveAt, setAutosaveAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CreateBriefResponse | null>(null)

  const industryList = useMemo(() => parseCsv(draft.industries), [draft.industries])
  const geoList = useMemo(() => parseCsv(draft.geos), [draft.geos])
  const sizeList = useMemo(() => parseCsv(draft.sizes), [draft.sizes])
  const personaList = useMemo(() => parseCsv(draft.personas), [draft.personas])
  const techList = useMemo(() => parseCsv(draft.tech), [draft.tech])
  const triggerList = useMemo(() => parseCsv(draft.triggers), [draft.triggers])
  const exclusionList = useMemo(() => parseCsv(draft.exclusions), [draft.exclusions])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUTOSAVE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { draft?: BriefDraft; savedAt?: string }
      if (parsed.draft) {
        setDraft({ ...DEFAULT_DRAFT, ...parsed.draft })
        setAutosaveAt(parsed.savedAt ?? null)
        setLoadedAutosave(true)
      }
    } catch {
      // Ignore invalid local draft payload.
    }
  }, [])

  useEffect(() => {
    try {
      const savedAt = new Date().toISOString()
      window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ draft, savedAt }))
      setAutosaveAt(savedAt)
    } catch {
      // Ignore local storage failures.
    }
  }, [draft])

  function updateDraft<K extends keyof BriefDraft>(key: K, value: BriefDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function buildStructuredPayload() {
    return {
      name: draft.name.trim() || `Prompt Brief (${new Date().toISOString().slice(0, 10)})`,
      description: draft.description.trim() || draft.prompt.trim(),
      industryFilters: industryList.map((value) => ({ type: 'industry', value })),
      geoFilters: geoList.map((value) => ({ type: 'geo', value })),
      sizeFilters: sizeList.map((value) => ({ type: 'employeeBand', value })),
      revenueFilters: [],
      personaFilters: personaList.map((value) => ({ type: 'persona', value })),
      techFilters: techList.map((value) => ({ type: 'tech', value })),
      triggerFilters: triggerList.map((value) => ({ type: 'trigger', value })),
      exclusionFilters: exclusionList.map((value) => ({ type: 'exclude', value })),
    }
  }

  async function submitBrief() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload = buildStructuredPayload()
      const response = await fetch('/api/briefs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tenantId: draft.tenantId,
          createdById: draft.createdById,
          prompt: draft.prompt.trim() || undefined,
          autoRun: draft.autoRun,
          ...payload,
        }),
      })
      const data = (await response.json()) as CreateBriefResponse
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to create brief')
      }
      setResult(data)
      window.localStorage.removeItem(AUTOSAVE_KEY)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create brief')
    } finally {
      setLoading(false)
    }
  }

  function nextStep() {
    setStep((current) => (current < 5 ? ((current + 1) as WizardStep) : current))
  }

  function previousStep() {
    setStep((current) => (current > 1 ? ((current - 1) as WizardStep) : current))
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Create Lead Brief</h1>
          <p className="text-sm text-slate-600">Use quick prompt mode or complete the 5-step wizard with autosave.</p>
        </header>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          {loadedAutosave ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
              Restored draft from autosave{autosaveAt ? ` (${new Date(autosaveAt).toLocaleString()})` : ''}.
            </p>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-700">
              <span className="font-medium">Tenant ID</span>
              <input
                value={draft.tenantId}
                onChange={(event) => updateDraft('tenantId', event.target.value)}
                placeholder="demo-business-pvt-ltd"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              <span className="font-medium">Created By</span>
              <input
                value={draft.createdById}
                onChange={(event) => updateDraft('createdById', event.target.value)}
                placeholder="system"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">Quick Prompt (optional)</span>
            <textarea
              value={draft.prompt}
              onChange={(event) => updateDraft('prompt', event.target.value)}
              rows={3}
              placeholder="Find SaaS companies in India with 11-200 employees hiring sales leaders."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Brief Wizard (Step {step} of 5)</h2>
            <div className="text-xs text-slate-500">Autosaves locally while you type</div>
          </div>

          {step === 1 ? (
            <div className="space-y-3">
              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-medium">Brief Name</span>
                <input
                  value={draft.name}
                  onChange={(event) => updateDraft('name', event.target.value)}
                  placeholder="SaaS Mid-Market Sales ICP"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-medium">Description</span>
                <textarea
                  value={draft.description}
                  onChange={(event) => updateDraft('description', event.target.value)}
                  rows={3}
                  placeholder="High-intent ICP for outbound activation."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-medium">Industries (comma-separated)</span>
                <input
                  value={draft.industries}
                  onChange={(event) => updateDraft('industries', event.target.value)}
                  placeholder="SaaS, Fintech"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-medium">Geographies (comma-separated)</span>
                <input
                  value={draft.geos}
                  onChange={(event) => updateDraft('geos', event.target.value)}
                  placeholder="India, UAE"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-medium">Company Sizes (comma-separated)</span>
                <input
                  value={draft.sizes}
                  onChange={(event) => updateDraft('sizes', event.target.value)}
                  placeholder="11-50, 51-200"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-medium">Personas (comma-separated)</span>
                <input
                  value={draft.personas}
                  onChange={(event) => updateDraft('personas', event.target.value)}
                  placeholder="Founder, VP Sales"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-medium">Tech Stack Hints (comma-separated)</span>
                <input
                  value={draft.tech}
                  onChange={(event) => updateDraft('tech', event.target.value)}
                  placeholder="HubSpot, Shopify"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-medium">Trigger Hints (comma-separated)</span>
                <input
                  value={draft.triggers}
                  onChange={(event) => updateDraft('triggers', event.target.value)}
                  placeholder="Hiring, Funding, Expansion"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-3">
              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-medium">Exclusions (comma-separated)</span>
                <input
                  value={draft.exclusions}
                  onChange={(event) => updateDraft('exclusions', event.target.value)}
                  placeholder="Agencies, Existing Customers"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <p className="font-medium">Review Summary</p>
                <p>Name: {buildStructuredPayload().name}</p>
                <p>Industries: {industryList.join(', ') || 'None'}</p>
                <p>Geos: {geoList.join(', ') || 'None'}</p>
                <p>Personas: {personaList.join(', ') || 'None'}</p>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <button
              onClick={previousStep}
              disabled={step === 1}
              className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={nextStep}
              disabled={step === 5}
              className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">Run Behavior</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={draft.autoRun}
              onChange={(event) => updateDraft('autoRun', event.target.checked)}
            />
            <span>Run discovery immediately after creating brief</span>
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={submitBrief}
              disabled={
                loading ||
                !draft.tenantId.trim() ||
                !draft.createdById.trim() ||
                (!draft.prompt.trim() && !draft.name.trim() && industryList.length === 0 && personaList.length === 0)
              }
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Brief'}
            </button>
            <Link href="/briefs" className="text-sm font-medium text-slate-700 underline">
              Back to briefs
            </Link>
          </div>
        </section>

        {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        {result?.item ? (
          <section className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p>
              Brief created: <span className="font-semibold">{result.item.name}</span> ({result.item.id})
            </p>
            {result.run ? (
              <p>
                Discovery started. Segment: <span className="font-semibold">{result.run.segmentId}</span>, Job:{' '}
                <span className="font-semibold">{result.run.jobId}</span>
              </p>
            ) : (
              <p>Discovery not started. You can run it from the briefs list.</p>
            )}
          </section>
        ) : null}
      </div>
    </main>
  )
}
