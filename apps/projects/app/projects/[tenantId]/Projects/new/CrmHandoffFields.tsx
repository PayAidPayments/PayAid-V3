'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
import { getAuthHeaders } from '@/lib/api/client'
import { crmContactUrl, crmDealUrl } from '../../projects-canonical-links'

type HandoffContact = { id: string; name: string; email: string | null; company: string | null }
type HandoffDeal = {
  id: string
  name: string
  stage: string
  value: number
  contactId: string | null
  contact: HandoffContact | null
}

export type CrmHandoffSelection = {
  clientId: string
  dealId: string
  contactLabel: string
  dealLabel: string
}

type CrmHandoffFieldsProps = {
  tenantId: string
  clientId: string
  dealId: string
  onClientIdChange: (clientId: string) => void
  onDealIdChange: (dealId: string) => void
  onLabelsChange?: (labels: { contactLabel: string; dealLabel: string }) => void
  /** Initial ids from URL (CRM deep link) */
  prefillContactId?: string | null
  prefillDealId?: string | null
}

function contactLabel(c: HandoffContact): string {
  const parts = [c.name]
  if (c.company) parts.push(c.company)
  if (c.email) parts.push(`(${c.email})`)
  return parts.join(' · ')
}

function dealLabel(d: HandoffDeal): string {
  const contact = d.contact?.name || 'No contact'
  return `${d.name} · ${contact} · ${d.stage}`
}

export function CrmHandoffFields({
  tenantId,
  clientId,
  dealId,
  onClientIdChange,
  onDealIdChange,
  onLabelsChange,
  prefillContactId,
  prefillDealId,
}: CrmHandoffFieldsProps) {
  const [contactSearch, setContactSearch] = useState('')
  const [dealSearch, setDealSearch] = useState('')
  const [contactLabelText, setContactLabelText] = useState('')
  const [dealLabelText, setDealLabelText] = useState('')

  const prefillApplied = useRef(false)
  const prefillKey = `${prefillContactId ?? ''}:${prefillDealId ?? ''}`
  const { data: prefillData } = useQuery({
    queryKey: ['projects-handoff-resolve', tenantId, prefillKey],
    queryFn: async () => {
      const q = new URLSearchParams()
      if (prefillDealId) q.set('dealId', prefillDealId)
      if (prefillContactId) q.set('contactId', prefillContactId)
      const response = await fetch(`/api/projects/handoff/resolve?${q.toString()}`, {
        headers: { ...getAuthHeaders() },
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Failed to resolve CRM handoff')
      }
      return response.json() as {
        contact: HandoffContact | null
        deal: HandoffDeal | null
        resolvedContactId: string | null
      }
    },
    enabled: Boolean(tenantId && (prefillContactId || prefillDealId)),
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!prefillData || prefillApplied.current) return
    prefillApplied.current = true
    if (prefillData.resolvedContactId) {
      onClientIdChange(prefillData.resolvedContactId)
    }
    if (prefillData.contact) {
      setContactLabelText(contactLabel(prefillData.contact))
    }
    if (prefillData.deal) {
      onDealIdChange(prefillData.deal.id)
      setDealLabelText(dealLabel(prefillData.deal))
    }
  }, [prefillData, onClientIdChange, onDealIdChange])

  useEffect(() => {
    onLabelsChange?.({ contactLabel: contactLabelText, dealLabel: dealLabelText })
  }, [contactLabelText, dealLabelText, onLabelsChange])

  const { data: contactsData, isFetching: contactsLoading } = useQuery({
    queryKey: ['projects-handoff-contacts', tenantId, contactSearch],
    queryFn: async () => {
      const q = new URLSearchParams({ limit: '25' })
      if (contactSearch.trim()) q.set('search', contactSearch.trim())
      const response = await fetch(`/api/projects/handoff/contacts?${q.toString()}`, {
        headers: { ...getAuthHeaders() },
      })
      if (!response.ok) throw new Error('Failed to load contacts')
      return response.json() as { contacts: HandoffContact[] }
    },
    enabled: Boolean(tenantId),
  })

  const { data: dealsData, isFetching: dealsLoading } = useQuery({
    queryKey: ['projects-handoff-deals', tenantId, dealSearch, clientId],
    queryFn: async () => {
      const q = new URLSearchParams({ limit: '25' })
      if (dealSearch.trim()) q.set('search', dealSearch.trim())
      if (clientId) q.set('contactId', clientId)
      const response = await fetch(`/api/projects/handoff/deals?${q.toString()}`, {
        headers: { ...getAuthHeaders() },
      })
      if (!response.ok) throw new Error('Failed to load deals')
      return response.json() as { deals: HandoffDeal[] }
    },
    enabled: Boolean(tenantId),
  })

  const contacts = contactsData?.contacts ?? []
  const deals = dealsData?.deals ?? []

  const applyContact = (id: string) => {
    const c = contacts.find((x) => x.id === id)
    onClientIdChange(id)
    if (c) setContactLabelText(contactLabel(c))
    if (dealId) {
      const d = deals.find((x) => x.id === dealId)
      if (d?.contactId && d.contactId !== id) {
        onDealIdChange('')
        setDealLabelText('')
      }
    }
  }

  const applyDeal = (id: string) => {
    const d = deals.find((x) => x.id === id)
    onDealIdChange(id)
    if (d) {
      setDealLabelText(dealLabel(d))
      if (d.contactId) {
        onClientIdChange(d.contactId)
        if (d.contact) setContactLabelText(contactLabel(d.contact))
      }
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="crm-contact-search" className="dark:text-gray-300">
          CRM contact
        </Label>
        <Input
          id="crm-contact-search"
          value={contactSearch}
          onChange={(e) => setContactSearch(e.target.value)}
          placeholder="Search by name, email, or company"
          className="mt-1 mb-2 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
        />
        <CustomSelect value={clientId || undefined} onValueChange={applyContact}>
          <CustomSelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
            {clientId
              ? contactLabelText || 'Selected contact'
              : contactsLoading
                ? 'Loading contacts…'
                : 'Select a contact'}
          </CustomSelectTrigger>
          <CustomSelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-64">
            {contacts.length === 0 ? (
              <CustomSelectItem value="__none" disabled className="dark:text-gray-400">
                No contacts found
              </CustomSelectItem>
            ) : (
              contacts.map((c) => (
                <CustomSelectItem key={c.id} value={c.id} className="dark:text-gray-100">
                  {contactLabel(c)}
                </CustomSelectItem>
              ))
            )}
          </CustomSelectContent>
        </CustomSelect>
        {clientId ? (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            <Link href={crmContactUrl(tenantId, clientId)} className="text-purple-600 hover:underline">
              View in CRM
            </Link>
          </p>
        ) : null}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Required for Agency / Support profile; recommended for commercial projects linked to CRM.
        </p>
      </div>

      <div>
        <Label htmlFor="crm-deal-search" className="dark:text-gray-300">
          CRM deal (optional)
        </Label>
        <Input
          id="crm-deal-search"
          value={dealSearch}
          onChange={(e) => setDealSearch(e.target.value)}
          placeholder="Search open deals"
          className="mt-1 mb-2 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
        />
        <CustomSelect
          value={dealId || '__none'}
          onValueChange={(id) => {
            if (id === '__none') {
              onDealIdChange('')
              setDealLabelText('')
              return
            }
            applyDeal(id)
          }}
        >
          <CustomSelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
            {dealId
              ? dealLabelText || 'Selected deal'
              : dealsLoading
                ? 'Loading deals…'
                : 'Link an open deal (optional)'}
          </CustomSelectTrigger>
          <CustomSelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-64">
            <CustomSelectItem value="__none" className="dark:text-gray-100">
              No deal linked
            </CustomSelectItem>
            {deals.map((d) => (
              <CustomSelectItem key={d.id} value={d.id} className="dark:text-gray-100">
                {dealLabel(d)}
              </CustomSelectItem>
            ))}
          </CustomSelectContent>
        </CustomSelect>
        {dealId ? (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            <Link href={crmDealUrl(tenantId, dealId)} className="text-purple-600 hover:underline">
              View deal in CRM
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  )
}

