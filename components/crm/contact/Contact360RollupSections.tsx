'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Activity,
  ClipboardList,
  FileSignature,
  FileText,
  FolderKanban,
  Lightbulb,
  Receipt,
  UserX,
  Wrench,
} from 'lucide-react'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { useTerms } from '@/lib/terminology/use-terms'

function num(v: unknown): number {
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

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-slate-500 shrink-0" />
      <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">{children}</h2>
    </div>
  )
}

interface Props {
  c360: any
  tenantId: string
  contactId: string
  /** Called after a duplicate is merged into this contact (refresh 360). */
  onAfterMerge?: () => void
}

export function Contact360RollupSections({ c360, tenantId, contactId, onAfterMerge }: Props) {
  const { term, pluralTerm } = useTerms()
  const [mergingDupId, setMergingDupId] = useState<string | null>(null)
  const [mergeError, setMergeError] = useState<string | null>(null)
  const [mergeSuccessWarnings, setMergeSuccessWarnings] = useState<string[] | null>(null)
  const [mergeSuccessNotices, setMergeSuccessNotices] = useState<string[] | null>(null)

  async function mergeDuplicateIntoCurrent(duplicateId: string, duplicateName: string) {
    const ok = window.confirm(
      `Merge "${duplicateName}" into this ${term('contact').toLowerCase()}? The duplicate will be removed after moving ${pluralTerm('deal').toLowerCase()}, orders, messages, and other links to this record. This cannot be undone.`
    )
    if (!ok) return
    setMergeError(null)
    setMergeSuccessWarnings(null)
    setMergeSuccessNotices(null)
    setMergingDupId(duplicateId)
    try {
      const res = await fetch('/api/contacts/duplicates', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryContactId: contactId,
          duplicateContactId: duplicateId,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Merge failed')
      }
      const w = json?.data?.warnings
      const n = json?.data?.notices
      if (Array.isArray(w) && w.length > 0) {
        setMergeSuccessWarnings(w as string[])
      }
      if (Array.isArray(n) && n.length > 0) {
        setMergeSuccessNotices(n as string[])
      }
      onAfterMerge?.()
    } catch (e) {
      setMergeError(e instanceof Error ? e.message : 'Merge failed')
    } finally {
      setMergingDupId(null)
    }
  }

  if (!c360) return null

  const quotes = c360.accountQuotes || []
  const proposals = c360.proposals || []
  const contracts = c360.contracts || []
  const invoices = c360.invoices || []
  const creditNotes = c360.creditNotes || []
  const debitNotes = c360.debitNotes || []
  const projects = c360.projects || []
  const workOrders = c360.workOrders || []
  const formSubmissions = c360.formSubmissions || []
  const surveyResponses = c360.surveyResponses || []
  const nurture = c360.nurtureEnrollments || []
  const loyalty = c360.loyaltyRows || []
  const advances = c360.realEstateAdvances || []
  const feed = c360.activityFeed || []
  const insight = c360.customerInsight
  const dupes = c360.duplicateSuggestions || []

  const quoteOwnerLabel = (q: any) => {
    if (q.contactId && q.contactId !== contactId && q.contact?.name) return q.contact.name
    const dc = q.deal?.contact
    if (dc && dc.id !== contactId) return dc.name
    return null
  }

  return (
    <>
      {quotes.length > 0 && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-4" data-testid="crm-contact-360-quotes">
          <SectionTitle icon={FileText}>Quotes</SectionTitle>
          <ul className="space-y-2">
            {quotes.map((q: any) => (
              <li key={q.id}>
                <Link
                  href={`/crm/${tenantId}/Quotes/${q.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-gray-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-gray-700/80 transition-colors"
                >
                  <span className="font-medium text-slate-900 dark:text-gray-100">{q.quoteNumber}</span>
                  <span className="text-xs capitalize text-slate-500">{q.status}</span>
                  <span className="text-xs font-medium">{formatINRForDisplay(q.total || 0)}</span>
                  {quoteOwnerLabel(q) ? (
                    <span className="text-[11px] text-slate-400 w-full">{quoteOwnerLabel(q)}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {proposals.length > 0 && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-4" data-testid="crm-contact-360-proposals">
          <SectionTitle icon={FileSignature}>Proposals</SectionTitle>
          <ul className="space-y-2">
            {proposals.map((p: any) => (
              <li key={p.id}>
                <Link
                  href={`/crm/${tenantId}/Proposals/${p.id}`}
                  data-testid={`crm-contact-360-proposal-${p.id}`}
                  className="block rounded-lg border border-slate-200 dark:border-gray-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-gray-700/80 transition-colors"
                >
                  <div className="font-medium text-slate-900 dark:text-gray-100">{p.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-2">
                    <span>{p.proposalNumber}</span>
                    <span className="capitalize">{p.status}</span>
                    <span>{formatINRForDisplay(p.total || 0)}</span>
                    {p.contactId !== contactId ? <span className="text-slate-400">{`Related ${term('contact').toLowerCase()}`}</span> : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {contracts.length > 0 && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-4" data-testid="crm-contact-360-contracts">
          <SectionTitle icon={FileSignature}>Contracts</SectionTitle>
          <ul className="space-y-2">
            {contracts.map((c: any) => (
              <li
                key={c.id}
                className="rounded-lg border border-slate-200 dark:border-gray-700 px-3 py-2 text-sm"
              >
                <div className="font-medium text-slate-900 dark:text-gray-100">{c.title}</div>
                <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-2">
                  <span>{c.contractNumber}</span>
                  <span>{c.status}</span>
                  {c.value != null ? <span>{formatINRForDisplay(num(c.value))}</span> : null}
                  {c.renewalDate ? (
                    <span>Renews {format(new Date(c.renewalDate), 'MMM d, yyyy')}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/contracts"
            className="inline-block mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Open contracts workspace
          </Link>
        </div>
      )}

      {(invoices.length > 0 || creditNotes.length > 0 || debitNotes.length > 0) && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-4" data-testid="crm-contact-360-finance">
          <SectionTitle icon={Receipt}>Finance</SectionTitle>
          {invoices.length > 0 && (
            <div className="mb-3">
              <div className="text-xs uppercase text-slate-500 mb-1.5">Invoices</div>
              <ul className="space-y-2">
                {invoices.map((inv: any) => {
                  const st = (inv.status || '').toLowerCase()
                  const overdue =
                    inv.dueDate &&
                    !inv.paidAt &&
                    new Date(inv.dueDate) < new Date() &&
                    st !== 'paid'
                  return (
                    <li key={inv.id}>
                      <Link
                        href={`/finance/${tenantId}/Invoices/${inv.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-gray-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-gray-700/80 transition-colors"
                      >
                        <span className="font-medium text-slate-900 dark:text-gray-100">{inv.invoiceNumber}</span>
                        <span className="text-xs capitalize text-slate-500">{inv.status}</span>
                        <span className="text-xs font-medium">{formatINRForDisplay(inv.total || 0)}</span>
                        {overdue ? (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 w-full">Overdue</span>
                        ) : null}
                        {inv.customer && inv.customerId !== contactId ? (
                          <span className="text-[11px] text-slate-400 w-full">{inv.customer.name}</span>
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          {creditNotes.length > 0 && (
            <div className="mb-3">
              <div className="text-xs uppercase text-slate-500 mb-1.5">Credit notes</div>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-gray-300">
                {creditNotes.map((n: any) => (
                  <li key={n.id} className="flex justify-between gap-2">
                    <span>{n.creditNoteNumber}</span>
                    <span className="capitalize">{n.status}</span>
                    <span>{formatINRForDisplay(n.total || 0)}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/finance/${tenantId}/Credit-Notes`}
                className="inline-block mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View credit notes
              </Link>
            </div>
          )}
          {debitNotes.length > 0 && (
            <div>
              <div className="text-xs uppercase text-slate-500 mb-1.5">Debit notes</div>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-gray-300">
                {debitNotes.map((n: any) => (
                  <li key={n.id} className="flex justify-between gap-2">
                    <span>{n.debitNoteNumber}</span>
                    <span className="capitalize">{n.status}</span>
                    <span>{formatINRForDisplay(n.total || 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {feed.length > 0 && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-4" data-testid="crm-contact-360-activity">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Activity className="w-4 h-4 text-slate-500 shrink-0" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">Activity</h2>
            </div>
            <Link
              href={`/crm/${tenantId}/inbox`}
              data-testid="crm-contact-360-inbox-link"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
            >
              Open CRM inbox
            </Link>
          </div>
          <ul className="space-y-2">
            {feed.map((row: any, idx: number) => {
              const channelKinds = ['email', 'whatsapp', 'sms', 'scheduled_email']
              const showInbox = channelKinds.includes(row.kind)
              return (
                <li
                  key={`${row.kind}-${row.at}-${idx}`}
                  className="text-xs border-l-2 border-slate-200 dark:border-gray-600 pl-3 py-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-slate-500 dark:text-gray-400">
                    <span>
                      {format(new Date(row.at), 'MMM d, yyyy HH:mm')} ·{' '}
                      <span className="capitalize text-slate-700 dark:text-gray-200">
                        {row.kind.replace(/_/g, ' ')}
                      </span>
                    </span>
                    {showInbox ? (
                      <Link
                        href={`/crm/${tenantId}/inbox`}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                        data-testid={`crm-contact-360-activity-inbox-${row.kind}`}
                      >
                        Inbox
                      </Link>
                    ) : null}
                  </div>
                  <div className="font-medium text-slate-800 dark:text-gray-100">{row.title}</div>
                  {row.subtitle ? <div className="text-slate-500 dark:text-gray-400">{row.subtitle}</div> : null}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {(projects.length > 0 || workOrders.length > 0) && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-4" data-testid="crm-contact-360-delivery">
          <SectionTitle icon={FolderKanban}>Delivery</SectionTitle>
          {projects.length > 0 && (
            <div className="mb-3">
              <div className="text-xs uppercase text-slate-500 mb-1.5">Projects</div>
              <ul className="space-y-2">
                {projects.map((p: any) => (
                  <li key={p.id}>
                    <Link
                      href={`/projects/${tenantId}/Projects/${p.id}`}
                      className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-200 dark:border-gray-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-gray-700/80 transition-colors"
                    >
                      <span className="font-medium text-slate-900 dark:text-gray-100">{p.name}</span>
                      <span className="text-xs text-slate-500">{p.status}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {workOrders.length > 0 && (
            <div>
              <div className="text-xs uppercase text-slate-500 mb-1.5">Work orders</div>
              <ul className="space-y-2">
                {workOrders.map((w: any) => (
                  <li
                    key={w.id}
                    className="rounded-lg border border-slate-200 dark:border-gray-700 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium">{w.workOrderNumber}</span>
                      <span className="text-xs text-slate-500">{w.serviceType}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {format(new Date(w.scheduledDate), 'MMM d, yyyy')} · {w.status}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {(formSubmissions.length > 0 ||
        surveyResponses.length > 0 ||
        nurture.length > 0 ||
        loyalty.length > 0) && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-4" data-testid="crm-contact-360-marketing">
          <SectionTitle icon={ClipboardList}>Forms & engagement</SectionTitle>
          {formSubmissions.length > 0 && (
            <div className="mb-3">
              <div className="text-xs uppercase text-slate-500 mb-1.5">Form submissions</div>
              <ul className="space-y-1 text-xs">
                {formSubmissions.map((f: any) => (
                  <li key={f.id} className="text-slate-600 dark:text-gray-300">
                    {f.form?.name || 'Form'} · {format(new Date(f.createdAt), 'MMM d, yyyy')} · {f.status}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {surveyResponses.length > 0 && (
            <div className="mb-3">
              <div className="text-xs uppercase text-slate-500 mb-1.5">Surveys</div>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-gray-300">
                {surveyResponses.map((s: any) => (
                  <li key={s.id}>
                    {s.survey?.name || 'Survey'} · {s.status}
                    {s.npsScore != null ? ` · NPS ${s.npsScore}` : ''}
                    {s.satisfactionScore != null ? ` · CSAT ${s.satisfactionScore}/5` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {nurture.length > 0 && (
            <div className="mb-3">
              <div className="text-xs uppercase text-slate-500 mb-1.5">Nurture</div>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-gray-300">
                {nurture.map((n: any) => (
                  <li key={n.id}>
                    {n.template?.name || 'Sequence'} · {n.status} · Step {n.completedSteps}/{n.totalSteps}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {loyalty.length > 0 && (
            <div>
              <div className="text-xs uppercase text-slate-500 mb-1.5">Loyalty</div>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-gray-300">
                {loyalty.map((l: any) => (
                  <li key={l.id}>
                    {l.program?.name || 'Program'} · {num(l.currentPoints).toLocaleString('en-IN')} pts
                    {l.tier ? ` · ${l.tier}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {advances.length > 0 && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-4">
          <SectionTitle icon={Receipt}>Real estate advances</SectionTitle>
          <ul className="space-y-1 text-xs text-slate-600 dark:text-gray-300">
            {advances.map((a: any) => (
              <li key={a.id}>
                {a.property?.propertyName || 'Property'} · {formatINRForDisplay(num(a.advanceAmount))} ·{' '}
                {a.paymentStatus}
              </li>
            ))}
          </ul>
        </div>
      )}

      {insight && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-4" data-testid="crm-contact-360-insights">
          <SectionTitle icon={Lightbulb}>{`${term('customer')} insights`}</SectionTitle>
          <div className="rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-900/40 px-3 py-3 text-xs space-y-2 text-slate-700 dark:text-gray-200">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span>Health {Math.round(insight.healthScore ?? 0)}/100</span>
              <span className="capitalize">Churn risk: {insight.churnRiskLevel || 'n/a'}</span>
              <span>Engagement {Math.round(insight.engagementScore ?? 0)}/100</span>
            </div>
            {insight.nextBestAction ? (
              <p>
                <span className="font-semibold text-slate-800 dark:text-gray-100">Next best: </span>
                {insight.nextBestAction}
              </p>
            ) : null}
            {Array.isArray(insight.recommendedActions) && insight.recommendedActions.length > 0 ? (
              <ul className="list-disc pl-4 space-y-0.5">
                {insight.recommendedActions.slice(0, 5).map((t: string, i: number) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      )}

      {dupes.length > 0 && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-4" data-testid="crm-contact-360-duplicates">
          <SectionTitle icon={UserX}>{`Possible duplicate ${pluralTerm('contact').toLowerCase()}`}</SectionTitle>
          <p className="text-xs text-slate-500 dark:text-gray-400 mb-2">
            {`Same email, phone, or GSTIN as another ${term('contact').toLowerCase()} — review before merging.`}
          </p>
          {mergeError ? (
            <p className="text-xs text-red-600 dark:text-red-400 mb-2" role="alert">
              {mergeError}
            </p>
          ) : null}
          {mergeSuccessNotices && mergeSuccessNotices.length > 0 ? (
            <div
              className="rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 mb-2 text-xs text-slate-800 dark:text-slate-100 space-y-1"
              data-testid="crm-contact-360-merge-notices"
              role="status"
            >
              <p className="font-semibold">Merge completed</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {mergeSuccessNotices.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {mergeSuccessWarnings && mergeSuccessWarnings.length > 0 ? (
            <div
              className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/40 px-3 py-2 mb-2 text-xs text-amber-950 dark:text-amber-100 space-y-1"
              data-testid="crm-contact-360-merge-warnings"
              role="status"
            >
              <p className="font-semibold">Merge completed — please review</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {mergeSuccessWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <ul className="space-y-3">
            {dupes.map((d: any) => (
              <li
                key={d.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-200 dark:border-gray-700 px-3 py-2"
              >
                <div className="min-w-0">
                  <Link
                    href={`/crm/${tenantId}/Contacts/${d.id}`}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    {d.name}
                  </Link>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {[d.email, d.phone, d.company].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <button
                  type="button"
                  title={mergingDupId === d.id ? 'Merging…' : `Merge duplicate into this ${term('contact').toLowerCase()}`}
                  disabled={mergingDupId !== null}
                  data-testid={`crm-contact-360-merge-dup-${d.id}`}
                  onClick={() => mergeDuplicateIntoCurrent(d.id, d.name)}
                  className="text-xs shrink-0 rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mergingDupId === d.id ? 'Merging…' : `Merge into this ${term('contact').toLowerCase()}`}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
