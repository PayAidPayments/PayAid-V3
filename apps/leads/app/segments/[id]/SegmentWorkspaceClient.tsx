'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

interface SegmentAccountRow {
  id: string
  companyName: string
  city: string | null
  region: string | null
  country: string | null
  industry: string | null
  employeeBand: string | null
  fitScore: number
  intentScore: number
  conversionPotential: number
  status: string
  contacts: Array<{ id: string }>
}

export function SegmentWorkspaceClient({
  tenantId,
  segmentId,
  accounts,
}: {
  tenantId: string
  segmentId: string
  accounts: SegmentAccountRow[]
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [savedSetId, setSavedSetId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSavingSet, setIsSavingSet] = useState(false)

  const selectedAccounts = useMemo(
    () => accounts.filter((account) => selectedIds.includes(account.id)),
    [accounts, selectedIds],
  )
  const selectedContactIds = useMemo(
    () => selectedAccounts.flatMap((account) => account.contacts.map((contact) => contact.id)),
    [selectedAccounts],
  )

  const activationHref = useMemo(() => {
    const query = new URLSearchParams()
    query.set('tenantId', tenantId)
    if (selectedIds.length > 0) query.set('accountIds', selectedIds.join(','))
    if (selectedContactIds.length > 0) query.set('contactIds', selectedContactIds.join(','))
    if (savedSetId) query.set('setId', savedSetId)
    return `/activation?${query.toString()}`
  }, [savedSetId, selectedContactIds, selectedIds, tenantId])

  function toggleAccount(accountId: string) {
    setSelectedIds((prev) => (prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]))
  }

  async function saveActivationSet() {
    if (selectedIds.length === 0) return
    setIsSavingSet(true)
    setSaveError(null)
    setSavedSetId(null)
    try {
      const response = await fetch('/api/activation/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          segmentId,
          setName: `Segment ${segmentId.slice(0, 8)} Selection`,
          setTag: 'segment-selection',
          accountIds: selectedIds,
          contactIds: selectedContactIds,
          initiatedById: 'system',
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? 'Failed to save activation set')
      setSavedSetId(data.id ?? null)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save activation set')
    } finally {
      setIsSavingSet(false)
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Activation Selection</p>
          <p className="text-xs text-slate-600">
            Selected accounts: {selectedIds.length} | Selected contacts: {selectedContactIds.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedIds(accounts.map((account) => account.id))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={saveActivationSet}
            disabled={selectedIds.length === 0 || isSavingSet}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {isSavingSet ? 'Saving...' : 'Save Activation Set'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            Clear
          </button>
          <Link
            href={activationHref}
            className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white"
          >
            Open Activation Review
          </Link>
        </div>
      </div>
      {savedSetId ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
          Saved activation set: {savedSetId}
        </div>
      ) : null}
      {saveError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{saveError}</div>
      ) : null}

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Geo</th>
              <th className="px-4 py-3">Industry</th>
              <th className="px-4 py-3">Employee Band</th>
              <th className="px-4 py-3">Fit</th>
              <th className="px-4 py-3">Intent</th>
              <th className="px-4 py-3">Conversion</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(account.id)}
                    onChange={() => toggleAccount(account.id)}
                    aria-label={`Select ${account.companyName}`}
                  />
                </td>
                <td className="px-4 py-3 font-medium">{account.companyName}</td>
                <td className="px-4 py-3">{[account.city, account.region, account.country].filter(Boolean).join(', ') || '-'}</td>
                <td className="px-4 py-3">{account.industry ?? '-'}</td>
                <td className="px-4 py-3">{account.employeeBand ?? '-'}</td>
                <td className="px-4 py-3">{account.fitScore}</td>
                <td className="px-4 py-3">{account.intentScore}</td>
                <td className="px-4 py-3">{account.conversionPotential}</td>
                <td className="px-4 py-3">{account.status}</td>
              </tr>
            ))}
            {accounts.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={9}>
                  No accounts discovered yet. Trigger segment refresh to run company-first discovery.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </section>
  )
}
