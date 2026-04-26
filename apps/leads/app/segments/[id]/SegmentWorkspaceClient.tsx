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

type SortKey = 'conversion_desc' | 'fit_desc' | 'intent_desc' | 'company_asc'

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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'SHORTLISTED' | 'READY_TO_ACTIVATE'>('ALL')
  const [minFit, setMinFit] = useState(0)
  const [minIntent, setMinIntent] = useState(0)
  const [contactsFilter, setContactsFilter] = useState<'all' | 'with_contacts' | 'without_contacts'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('conversion_desc')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const filteredAccounts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const filtered = accounts.filter((account) => {
      if (normalizedSearch && !account.companyName.toLowerCase().includes(normalizedSearch)) return false
      if (statusFilter !== 'ALL' && account.status !== statusFilter) return false
      if (account.fitScore < minFit) return false
      if (account.intentScore < minIntent) return false
      if (contactsFilter === 'with_contacts' && account.contacts.length === 0) return false
      if (contactsFilter === 'without_contacts' && account.contacts.length > 0) return false
      return true
    })

    return filtered.sort((a, b) => {
      if (sortKey === 'conversion_desc') return b.conversionPotential - a.conversionPotential
      if (sortKey === 'fit_desc') return b.fitScore - a.fitScore
      if (sortKey === 'intent_desc') return b.intentScore - a.intentScore
      return a.companyName.localeCompare(b.companyName)
    })
  }, [accounts, contactsFilter, minFit, minIntent, search, sortKey, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / pageSize))
  const pagedAccounts = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredAccounts.slice(start, start + pageSize)
  }, [filteredAccounts, page])

  const selectedAccounts = useMemo(
    () => filteredAccounts.filter((account) => selectedIds.includes(account.id)),
    [filteredAccounts, selectedIds],
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

  function resetFilters() {
    setSearch('')
    setStatusFilter('ALL')
    setMinFit(0)
    setMinIntent(0)
    setContactsFilter('all')
    setSortKey('conversion_desc')
    setPage(1)
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
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-1 text-xs text-slate-600">
            <span className="font-medium">Search Company</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search name..."
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-600">
            <span className="font-medium">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as typeof statusFilter)
                setPage(1)
              }}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs"
            >
              <option value="ALL">All</option>
              <option value="NEW">New</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="READY_TO_ACTIVATE">Ready to Activate</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-slate-600">
            <span className="font-medium">Min Fit</span>
            <input
              type="number"
              min={0}
              max={100}
              value={minFit}
              onChange={(event) => {
                setMinFit(Number(event.target.value || 0))
                setPage(1)
              }}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-600">
            <span className="font-medium">Min Intent</span>
            <input
              type="number"
              min={0}
              max={100}
              value={minIntent}
              onChange={(event) => {
                setMinIntent(Number(event.target.value || 0))
                setPage(1)
              }}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-600">
            <span className="font-medium">Contacts</span>
            <select
              value={contactsFilter}
              onChange={(event) => {
                setContactsFilter(event.target.value as typeof contactsFilter)
                setPage(1)
              }}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs"
            >
              <option value="all">All</option>
              <option value="with_contacts">With contacts</option>
              <option value="without_contacts">Without contacts</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-slate-600">
            <span className="font-medium">Sort</span>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs"
            >
              <option value="conversion_desc">Conversion desc</option>
              <option value="fit_desc">Fit desc</option>
              <option value="intent_desc">Intent desc</option>
              <option value="company_asc">Company A-Z</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
          <p>
            Showing {pagedAccounts.length} of {filteredAccounts.length} filtered accounts (total {accounts.length}).
          </p>
          <button type="button" onClick={resetFilters} className="rounded border border-slate-300 px-2 py-1">
            Reset Filters
          </button>
        </div>
      </div>

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
            onClick={() => setSelectedIds(pagedAccounts.map((account) => account.id))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            Select visible
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
              <th className="px-4 py-3">Contacts</th>
              <th className="px-4 py-3">Evidence Cue</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {pagedAccounts.map((account) => (
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
                <td className="px-4 py-3">{account.contacts.length}</td>
                <td className="px-4 py-3">
                  {account.contacts.length > 0 && account.fitScore >= 60 && account.intentScore >= 50 ? (
                    <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800">Strong</span>
                  ) : account.contacts.length > 0 ? (
                    <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800">Needs review</span>
                  ) : (
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">Resolve contacts</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      account.status === 'READY_TO_ACTIVATE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : account.status === 'SHORTLISTED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {account.status}
                  </span>
                </td>
              </tr>
            ))}
            {pagedAccounts.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={11}>
                  No accounts match current filters. Adjust filters or trigger segment refresh.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <div className="flex items-center justify-end gap-2 text-xs">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page === 1}
          className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-slate-600">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={page === totalPages}
          className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  )
}
