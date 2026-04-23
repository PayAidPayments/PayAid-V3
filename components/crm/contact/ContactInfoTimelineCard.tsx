'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { User, Building2, ShoppingBag, Users, CalendarClock, HeartPulse, Lock } from 'lucide-react'
import { ContactTimeline, type ActivityFilter } from './ContactTimeline'
import { Contact360RollupSections } from './Contact360RollupSections'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { useUpdateContact } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { useTerms } from '@/lib/terminology/use-terms'

interface ContactInfoTimelineCardProps {
  contact: any
  tenantId: string
  contactId: string
  timelineFilter?: ActivityFilter
  /** Refetch contact (e.g. after merging a duplicate into this record). */
  onRefetchContact?: () => void
}

function numPredicted(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'object' && v !== null && 'toNumber' in v && typeof (v as { toNumber: () => number }).toNumber === 'function') {
    try {
      return (v as { toNumber: () => number }).toNumber()
    } catch {
      return 0
    }
  }
  const n = Number(v)
  return Number.isNaN(n) ? 0 : n
}

export const ContactInfoTimelineCard: React.FC<ContactInfoTimelineCardProps> = ({
  contact,
  tenantId,
  contactId,
  timelineFilter = 'all',
  onRefetchContact,
}) => {
  const { term, pluralTerm } = useTerms()
  const updateContact = useUpdateContact()
  const [internalDraft, setInternalDraft] = useState(contact?.internalNotes ?? '')

  useEffect(() => {
    setInternalDraft(contact?.internalNotes ?? '')
  }, [contact?.internalNotes, contactId])
  const c360 = contact?.contact360
  const deals = c360 != null ? c360.accountDeals ?? [] : contact?.deals ?? []
  const activeDeals = deals.filter((d: any) => d.stage !== 'won' && d.stage !== 'lost')
  const totalPipelineValue = activeDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0)

  const related = c360?.relatedContacts || []
  const orders = c360?.accountOrders || []
  const accountRecord = c360?.accountRecord || contact?.account

  const dealsListHref = React.useMemo(() => {
    const base = `/crm/${tenantId}/Deals`
    const from = 'from=contact360'
    if (c360 != null && contact?.accountId) {
      return `${base}?accountId=${encodeURIComponent(contact.accountId)}&${from}`
    }
    if (c360?.peerContactIds?.length) {
      return `${base}?contactIds=${encodeURIComponent(c360.peerContactIds.join(','))}&${from}`
    }
    return `${base}?contactId=${encodeURIComponent(contactId)}`
  }, [tenantId, contactId, c360, contact?.accountId])

  const completenessFields = [
    Boolean(contact?.email?.trim()),
    Boolean(contact?.phone?.trim()),
    Boolean(contact?.company?.trim() || contact?.accountId),
    Boolean(contact?.gstin?.trim()),
    Boolean(contact?.accountId),
  ]
  const completenessPct = Math.round(
    (completenessFields.filter(Boolean).length / completenessFields.length) * 100
  )

  const showHealthStrip =
    contact?.churnRisk === true ||
    contact?.likelyToBuy === true ||
    (contact?.leadScore ?? 0) > 0 ||
    numPredicted(contact?.predictedRevenue) > 0 ||
    Boolean(contact?.nurtureStage)

  return (
    <section
      className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-5 space-y-6"
      data-testid="crm-contact-360"
    >
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-3">{`${term('contact')} Profile`}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Email</div>
            <div className="text-slate-800 dark:text-gray-200">
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  {contact.email}
                </a>
              ) : (
                <span className="text-slate-400 dark:text-gray-500">-</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Phone</div>
            <div className="text-slate-800 dark:text-gray-200">
              {contact.phone ? (
                <a href={`tel:${contact.phone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  {contact.phone}
                </a>
              ) : (
                <span className="text-slate-400 dark:text-gray-500">-</span>
              )}
            </div>
          </div>
          {contact.gstin ? (
            <div className="col-span-2">
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">GSTIN</div>
              <div className="text-slate-800 dark:text-gray-200 font-mono text-sm">{contact.gstin}</div>
            </div>
          ) : null}
          {contact.address && (
            <div className="col-span-2">
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Address</div>
              <div className="text-slate-800 dark:text-gray-200">
                {contact.address}
                {contact.city && `, ${contact.city}`}
                {contact.state && `, ${contact.state}`}
                {contact.postalCode && ` ${contact.postalCode}`}
                {contact.country && `, ${contact.country}`}
              </div>
            </div>
          )}
          {accountRecord && (
            <div className="col-span-2">
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">{`Linked ${term('account').toLowerCase()}`}</div>
              <div className="text-slate-800 dark:text-gray-200 flex items-center gap-1.5 flex-wrap">
                <Building2 className="w-3 h-3 shrink-0" />
                <Link
                  href={`/crm/${tenantId}/Accounts/${accountRecord.id}`}
                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {accountRecord.name}
                </Link>
                {accountRecord.industry && (
                  <span className="text-xs text-slate-500 dark:text-gray-400">({accountRecord.industry})</span>
                )}
              </div>
              {accountRecord.parentAccount ? (
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                  Parent:{' '}
                  <Link
                    href={`/crm/${tenantId}/Accounts/${accountRecord.parentAccount.id}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {accountRecord.parentAccount.name}
                  </Link>
                </p>
              ) : null}
            </div>
          )}
          <div>
            <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Company</div>
            <div className="text-slate-800 dark:text-gray-200 flex items-center gap-1">
              {contact.company ? (
                <>
                  <Building2 className="w-3 h-3" />
                  {contact.company}
                </>
              ) : (
                <span className="text-slate-400 dark:text-gray-500">-</span>
              )}
            </div>
          </div>
          {contact.assignedTo && (
            <div>
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Assigned To</div>
              <div className="text-slate-800 dark:text-gray-200 flex items-center gap-1">
                <User className="w-3 h-3" />
                {contact.assignedTo.name || contact.assignedTo.user?.name || 'Unassigned'}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Created</div>
            <div className="text-slate-800 dark:text-gray-200">
              {contact.createdAt ? format(new Date(contact.createdAt), 'MMM d, yyyy') : '-'}
            </div>
          </div>
          {contact.source && (
            <div>
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Source</div>
              <div className="text-slate-800 dark:text-gray-200 capitalize">{contact.source}</div>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-gray-300">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-gray-700 px-2 py-0.5">
            Profile data {completenessPct}%
          </span>
          {(contact.lastContactedAt || contact.nextFollowUp) && (
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-gray-400">
              <CalendarClock className="w-3.5 h-3.5" />
              {contact.lastContactedAt
                ? `Last touch ${format(new Date(contact.lastContactedAt), 'MMM d, yyyy')}`
                : ''}
              {contact.lastContactedAt && contact.nextFollowUp ? ' · ' : ''}
              {contact.nextFollowUp
                ? `Next follow-up ${format(new Date(contact.nextFollowUp), 'MMM d, yyyy')}`
                : ''}
            </span>
          )}
          <Link
            href={`/crm/${tenantId}/Tasks/new`}
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {`Add ${term('task').toLowerCase()}`}
          </Link>
        </div>

        {showHealthStrip && (
          <div
            className="mt-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/90 dark:bg-gray-900/50 px-3 py-2.5 flex flex-wrap items-center gap-3 text-xs"
            data-testid="crm-contact-health-strip"
          >
            <HeartPulse className="w-4 h-4 text-slate-500 shrink-0" />
            {contact.churnRisk ? (
              <span className="text-amber-700 dark:text-amber-300 font-medium">Churn risk</span>
            ) : null}
            {contact.likelyToBuy ? (
              <span className="text-emerald-700 dark:text-emerald-300 font-medium">Likely to buy</span>
            ) : null}
            {(contact.leadScore ?? 0) > 0 ? (
              <span>{`${term('lead')} score ${Math.round(contact.leadScore)}`}</span>
            ) : null}
            {numPredicted(contact.predictedRevenue) > 0 ? (
              <span>Predicted {formatINRForDisplay(numPredicted(contact.predictedRevenue))}</span>
            ) : null}
            {contact.nurtureStage ? (
              <span className="capitalize">Nurture: {contact.nurtureStage}</span>
            ) : null}
          </div>
        )}

        {c360?.scope === 'solo' && (
          <p className="mt-3 text-xs text-slate-500 dark:text-gray-400">
            Link this contact to an account or set a company name to see related people, shared deals, and orders.
          </p>
        )}
      </div>

      {c360 && c360.scope !== 'solo' && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-1">Account context</h2>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            {c360.scope === 'account' ? 'CRM account: ' : 'Same company: '}
            <span className="text-slate-700 dark:text-gray-300 font-medium">{c360.scopeLabel}</span>
          </p>
        </div>
      )}

      {related.length > 0 && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">{`Related ${pluralTerm('contact').toLowerCase()}`}</h2>
          </div>
          <ul className="space-y-2">
            {related.map((row: any) => (
              <li key={row.id}>
                <Link
                  href={`/crm/${tenantId}/Contacts/${row.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-slate-200 dark:border-gray-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-gray-700/80 transition-colors"
                >
                  <span className="font-medium text-slate-900 dark:text-gray-100">{row.name}</span>
                  <span className="text-xs text-slate-500 dark:text-gray-400">
                    {[row.email, row.phone].filter(Boolean).join(' · ') || row.stage || '—'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {deals.length > 0 && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">{pluralTerm('deal')}</h2>
              {c360 != null ? (
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                  This contact and related people ({deals.length} shown)
                </p>
              ) : null}
            </div>
            {deals.length > 0 && (
              <Link
                href={dealsListHref}
                data-testid="crm-contact-360-view-deals"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
              >
                {`View in ${pluralTerm('deal')}`}
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {activeDeals.slice(0, 4).map((deal: any) => (
              <Link
                key={deal.id}
                href={`/crm/${tenantId}/Deals/${deal.id}`}
                className="block p-2 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-gray-100 truncate">{deal.name}</div>
                    <div className="text-xs text-slate-500 dark:text-gray-400">
                      {formatINRForDisplay(deal.value || 0)} · {deal.probability ?? 0}% probability
                      {deal.contact && deal.contactId !== contactId ? (
                        <span className="text-slate-400"> · {deal.contact.name}</span>
                      ) : null}
                    </div>
                    {deal.stage === 'lost' && deal.lostReason ? (
                      <div className="text-[11px] text-slate-500 mt-0.5">Lost: {deal.lostReason}</div>
                    ) : null}
                    {deal.stage === 'won' && deal.wonReason ? (
                      <div className="text-[11px] text-slate-500 mt-0.5">Won: {deal.wonReason}</div>
                    ) : null}
                    {deal.competitor ? (
                      <div className="text-[11px] text-slate-500">Competitor: {deal.competitor}</div>
                    ) : null}
                  </div>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 capitalize shrink-0">
                    {deal.stage}
                  </span>
                </div>
              </Link>
            ))}
            {activeDeals.length === 0 && deals.length > 0 && (
              <div className="text-xs text-slate-500 dark:text-gray-400">
                {`${deals.length} ${deals.length !== 1 ? pluralTerm('deal').toLowerCase() : term('deal').toLowerCase()} (all closed)`}
              </div>
            )}
          </div>
          {totalPipelineValue > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-gray-400">{`Open ${term('pipeline').toLowerCase()} (shown)`}</span>
                <span className="font-semibold text-slate-900 dark:text-gray-100">
                  {formatINRForDisplay(totalPipelineValue)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {c360 && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">Orders</h2>
          </div>
          {orders.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-gray-400">No orders for this contact or related contacts.</p>
          ) : (
            <ul className="space-y-2">
              {orders.map((order: any) => (
                <li key={order.id}>
                  <Link
                    href={`/sales/${tenantId}/Orders/${order.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-gray-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-gray-700/80 transition-colors"
                  >
                    <span className="font-medium text-slate-900 dark:text-gray-100">{order.orderNumber}</span>
                    <span className="text-xs capitalize text-slate-500 dark:text-gray-400">{order.status}</span>
                    <span className="text-xs font-medium text-slate-800 dark:text-gray-200">
                      {formatINRForDisplay(order.total || 0)}
                    </span>
                    {order.customer && order.customerId !== contactId ? (
                      <span className="text-[11px] text-slate-400 w-full">{order.customer.name}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Contact360RollupSections
        c360={c360}
        tenantId={tenantId}
        contactId={contactId}
        onAfterMerge={onRefetchContact}
      />

      <div
        className="border-t border-slate-100 dark:border-gray-700 pt-4"
        data-testid="crm-contact-staff-notes"
      >
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">Staff notes</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-gray-400 mb-2">
          Internal only — not mixed into the activity timeline or customer-facing profile notes.
        </p>
        <textarea
          value={internalDraft}
          onChange={(e) => setInternalDraft(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-100 px-3 py-2"
          placeholder="Private notes for your team…"
          disabled={updateContact.isPending}
        />
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={
              updateContact.isPending || internalDraft === (contact?.internalNotes ?? '')
            }
            title={updateContact.isPending ? 'Saving…' : undefined}
            onClick={async () => {
              await updateContact.mutateAsync({
                id: contactId,
                tenantId,
                data: { internalNotes: internalDraft },
              })
              onRefetchContact?.()
            }}
          >
            {updateContact.isPending ? 'Saving…' : 'Save staff notes'}
          </Button>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-gray-700 pt-4">
        <ContactTimeline
          contactId={contactId}
          tenantId={tenantId}
          tasks={contact.tasks || []}
          notes={contact.notes || undefined}
          activeFilter={timelineFilter}
          showControls={false}
        />
      </div>
    </section>
  )
}
