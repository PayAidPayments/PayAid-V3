'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useContact, useDeleteContact } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { format, formatDistanceToNow } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import { PageLoading } from '@/components/ui/loading'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  RefreshCw,
  Mail, 
  MessageSquare, 
  Phone,
  FileText,
  Briefcase,
  Edit,
  Trash2,
  Link2,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { usePageAIExtraStore } from '@/lib/stores/page-ai-extra'
import { useToast } from '@/components/ui/toast'
import { CopyAction } from '@/components/ui/copy-action'
import { LeadAllocationDialog } from '@/components/LeadAllocationDialog'
import { NurtureSequenceApplier } from '@/components/NurtureSequenceApplier'
import { NextBestActionCard } from '@/components/crm/contact/NextBestActionCard'
import { ContactIntelligenceCard } from '@/components/crm/contact/ContactIntelligenceCard'
import { AutomationStatusCard } from '@/components/crm/contact/AutomationStatusCard'
import { AuditActionTimelineCard } from '@/components/crm/AuditActionTimelineCard'
import { AIAssistCard } from '@/components/crm/contact/AIAssistCard'

type ActivityFilter = 'all' | 'email' | 'call' | 'whatsapp' | 'meeting' | 'task' | 'note' | 'deal'

function ContactRailSkeleton({ className = 'h-28' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 animate-pulse ${className}`}
      aria-hidden
    />
  )
}

function StageBadge({ stage }: { stage?: string }) {
  return (
    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
      {stage || 'contact'}
    </span>
  )
}

function LeadScoringBadge({ score }: { score: number }) {
  return (
    <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
      Score: {score}
    </span>
  )
}

function ContactInfoTimelineCard({
  contact,
}: {
  contact: any
  tenantId: string
  contactId: string
  timelineFilter: ActivityFilter
  onRefetchContact: () => void
}) {
  const latest = Array.isArray(contact?.interactions) ? contact.interactions.slice(0, 5) : []
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-2">Latest activity</h3>
      {latest.length > 0 ? (
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {latest.map((item: any) => (
            <li key={item.id} className="flex items-center justify-between gap-2">
              <span className="capitalize">{item.type || 'activity'}</span>
              <span className="text-xs text-slate-500">
                {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : '-'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">No recent activities yet.</p>
      )}
    </div>
  )
}

export default function ContactDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: contact, isLoading, isError, error, refetch } = useContact(id, tenantId, { include360: true })
  const deleteContact = useDeleteContact()
  const [showAllocationDialog, setShowAllocationDialog] = useState(false)
  const [showNurtureDialog, setShowNurtureDialog] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)
  const [showContactActions, setShowContactActions] = useState(false)
  const [timelineFilter, setTimelineFilter] = useState<ActivityFilter>('all')
  const [rescoreLoading, setRescoreLoading] = useState(false)
  const { token } = useAuthStore()
  const { toast, ToastContainer: PageToastContainer } = useToast()

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      try {
        await deleteContact.mutateAsync({ id, tenantId })
        router.push(`/crm/${tenantId}/Contacts`)
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete contact')
      }
    }
  }

  // Get normalized stage (handle both stage and legacy type field)
  const contactStage = contact?.stage || (contact?.type === 'lead' ? 'prospect' : contact?.type === 'customer' ? 'customer' : 'contact')
  const isProspect = contactStage === 'prospect' || contact?.type === 'lead'
  const isCustomerPortalEligible = contactStage === 'customer' || contact?.type === 'customer'
  const ownerName = contact?.assignedTo?.name || contact?.assignedTo?.user?.name || 'Unassigned'
  const lastTouchLabel = contact?.lastContactedAt
    ? formatDistanceToNow(new Date(contact.lastContactedAt), { addSuffix: true })
    : 'No recent touch'
  const nextTask = contact?.tasks?.[0]
  const preferredChannel =
    contact?.email?.trim()
      ? 'Email'
      : contact?.phone?.trim()
        ? 'Phone / WhatsApp'
        : 'Not set'
  const openDeals = (contact?.contact360?.accountDeals || []).filter((deal: any) => deal?.stage !== 'won' && deal?.stage !== 'lost')
  const wonValue = (contact?.contact360?.accountDeals || [])
    .filter((deal: any) => deal?.stage === 'won')
    .reduce((sum: number, deal: any) => sum + Number(deal?.value || 0), 0)
  const overdueInvoices = (contact?.contact360?.invoices || []).filter((invoice: any) => invoice?.status !== 'paid')
  const timelineTabs: Array<{ key: ActivityFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'email', label: 'Emails' },
    { key: 'call', label: 'Calls' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'meeting', label: 'Meetings' },
    { key: 'task', label: 'Tasks' },
    { key: 'note', label: 'Notes' },
    { key: 'deal', label: 'Deals' },
  ]

  const handleAiRescore = async () => {
    if (!token || !id) return
    setRescoreLoading(true)
    try {
      const r = await fetch('/api/leads/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contactId: id, useGroq: true }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        toast.error('Rescore failed', (data as { error?: string }).error || 'Could not refresh lead score.')
        return
      }
      await queryClient.invalidateQueries({ queryKey: ['contact', id, tenantId] })
      await queryClient.invalidateQueries({ queryKey: ['lead-nurture', id] })
      await refetch()
      toast.success('Score updated', 'Lead score was refreshed.')
    } catch {
      toast.error('Rescore failed', 'Network error while rescoring.')
    } finally {
      setRescoreLoading(false)
    }
  }

  const resolvePortalLink = async () => {
    if (!token || !tenantId || !isCustomerPortalEligible) return
    try {
      const r = await fetch(
        `/api/portal/token?tenantId=${encodeURIComponent(tenantId)}&contactId=${encodeURIComponent(id)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await r.json()
      if (r.ok && data.portalUrl) {
        return data.portalUrl as string
      }
    } catch {
      toast.error('Portal link failed', 'Could not generate portal link right now.')
    }
    return ''
  }

  useEffect(() => {
    if (!contact) {
      usePageAIExtraStore.getState().setExtra(null)
      return () => {
        usePageAIExtraStore.getState().setExtra(null)
      }
    }
    const c360 = contact.contact360
    usePageAIExtraStore.getState().setExtra({
      entity: 'contact',
      contactId: id,
      name: contact.name,
      ...(c360
        ? {
            contact360Rollups: {
              deals: c360.accountDeals?.length ?? 0,
              orders: c360.accountOrders?.length ?? 0,
              quotes: c360.accountQuotes?.length ?? 0,
              invoices: c360.invoices?.length ?? 0,
              proposals: c360.proposals?.length ?? 0,
              contracts: c360.contracts?.length ?? 0,
              relatedContacts: c360.relatedContacts?.length ?? 0,
              activityFeedItems: c360.activityFeed?.length ?? 0,
            },
          }
        : {}),
    })
    return () => {
      usePageAIExtraStore.getState().setExtra(null)
    }
  }, [contact, id])

  if (isLoading) {
    return <PageLoading message="Loading contact..." fullScreen={false} />
  }

  if (isError) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          {error instanceof Error ? error.message : 'Could not load this contact.'}
        </p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
        <Link href={`/crm/${tenantId}/AllPeople`}>
          <Button variant="secondary" className="ml-2">Back to contacts</Button>
        </Link>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This contact ID is missing or you don&apos;t have access. If you opened a link from another workspace, switch accounts or open the contact from All People for this tenant.
        </p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
        <Link href={`/crm/${tenantId}/AllPeople`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 ml-2">Back to All People</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900" data-testid="crm-contact-detail">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* AI entry point: open the page-scoped assistant */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-page-ai'))}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Ask PayAid AI about this contact
          </button>
        </div>
        {/* Header Band */}
        <header data-testid="contact-header" className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm px-5 py-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-gray-100">{contact.name}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{contact.company || 'No company'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StageBadge stage={contactStage} />
              <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                contact.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                contact.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {contact.status || 'active'}
              </span>
              {isProspect && contact.leadScore !== undefined && contact.leadScore !== null && (
                <LeadScoringBadge score={contact.leadScore} />
              )}
              <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                Owner: {ownerName}
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                Last touch: {lastTouchLabel}
              </span>
            </div>
          </div>
          <div data-testid="contact-primary-actions" className="flex flex-wrap justify-end gap-2 ml-4">
            <Popover open={showContactActions} onOpenChange={setShowContactActions}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Contact
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2">
                <div className="space-y-1">
                  {contact.phone ? (
                    <Link href={`/crm/${tenantId}/Dialer?contactId=${id}`}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Phone className="w-3.5 h-3.5 mr-2" />
                        Call
                      </Button>
                    </Link>
                  ) : null}
                  {contact.email ? (
                    <Link href={`/crm/${tenantId}/inbox?contactId=${id}&compose=1&channel=email`}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Mail className="w-3.5 h-3.5 mr-2" />
                        Email
                      </Button>
                    </Link>
                  ) : null}
                  {contact.phone ? (
                    <Link href={`/crm/${tenantId}/OutboxOps?contactId=${id}&channel=whatsapp`}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <MessageSquare className="w-3.5 h-3.5 mr-2" />
                        WhatsApp
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </PopoverContent>
            </Popover>
            <Link href={`/crm/${tenantId}/Deals/new?contactId=${id}`}>
              <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <Briefcase className="w-3 h-3 mr-1" />
                Create Deal
              </Button>
            </Link>
            <Popover open={showMoreActions} onOpenChange={setShowMoreActions}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  <MoreHorizontal className="w-3.5 h-3.5 mr-1" />
                  More
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2">
                <div className="space-y-1">
                  {isProspect && (
                    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setShowAllocationDialog(true)}>
                      <RefreshCw className="w-3.5 h-3.5 mr-2" />
                      {contact.assignedTo ? 'Reassign owner' : 'Assign owner'}
                    </Button>
                  )}
                  {isProspect && (
                    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setShowNurtureDialog(true)}>
                      <MessageSquare className="w-3.5 h-3.5 mr-2" />
                      Add to nurture
                    </Button>
                  )}
                  {(contact.type === 'customer' || contact.type === 'lead') && (
                    <Link href={`/finance/${tenantId}/Invoices/new?customerId=${id}`}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <FileText className="w-3.5 h-3.5 mr-2" />
                        Create invoice
                      </Button>
                    </Link>
                  )}
                  <CopyAction
                    textToCopy={resolvePortalLink}
                    successMessage="Customer portal link copied to clipboard."
                    label="Copy portal link"
                    copiedLabel="Copied"
                    icon={<Link2 className="w-3.5 h-3.5 mr-2" />}
                    buttonProps={{
                      variant: 'ghost',
                      size: 'sm',
                      className: 'w-full justify-start',
                      disabled: !isCustomerPortalEligible,
                      title: !isCustomerPortalEligible ? 'Portal link is available only for customers' : undefined,
                    }}
                    showFeedback={false}
                  />
                  <Link href={`/crm/${tenantId}/Contacts/${id}/Edit`}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Edit className="w-3.5 h-3.5 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 dark:text-red-400"
                    onClick={handleDelete}
                    disabled={deleteContact.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* GST / e-invoice hooks for CRM audit (values when present) */}
        <div className="sr-only" aria-hidden>
          <span data-gst={contact.gstin ?? ''} />
          <span data-invoice={contact.type === 'customer' || contact.type === 'lead' ? 'available' : ''} />
          <span data-irn={contact.gstin ? 'optional' : ''} />
          <span data-qr="gst-compliance" />
        </div>

        {/* Body Band - 2 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr),minmax(0,1.1fr)] gap-5">
          {/* Left Column: Summary + Context + Timeline */}
          <section className="space-y-4">
            <div data-testid="contact-summary-card" className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-3">Contact Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">Email</div>
                  <div className="text-slate-800 dark:text-gray-200">{contact.email || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">Phone</div>
                  <div className="text-slate-800 dark:text-gray-200">{contact.phone || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">Owner</div>
                  <div className="text-slate-800 dark:text-gray-200">{ownerName}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">Preferred channel</div>
                  <div className="text-slate-800 dark:text-gray-200">{preferredChannel}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">Last activity</div>
                  <div className="text-slate-800 dark:text-gray-200">{lastTouchLabel}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">Next scheduled task</div>
                  <div className="text-slate-800 dark:text-gray-200">{nextTask?.title || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">Source</div>
                  <div className="text-slate-800 dark:text-gray-200 capitalize">{contact.source || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">Created</div>
                  <div className="text-slate-800 dark:text-gray-200">{contact.createdAt ? format(new Date(contact.createdAt), 'MMM d, yyyy') : '-'}</div>
                </div>
              </div>
            </div>

            <div data-testid="relationship-summary-card" className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-3">Relationship & Commercial Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-3">
                  <div className="text-xs text-slate-500 dark:text-gray-400">Open deals</div>
                  <div className="mt-1 font-semibold text-slate-900 dark:text-gray-100">{openDeals.length}</div>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-3">
                  <div className="text-xs text-slate-500 dark:text-gray-400">Won value</div>
                  <div className="mt-1 font-semibold text-slate-900 dark:text-gray-100">₹{wonValue.toLocaleString('en-IN')}</div>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-3">
                  <div className="text-xs text-slate-500 dark:text-gray-400">Orders</div>
                  <div className="mt-1 font-semibold text-slate-900 dark:text-gray-100">{contact?.contact360?.accountOrders?.length ?? 0}</div>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-3">
                  <div className="text-xs text-slate-500 dark:text-gray-400">Invoices</div>
                  <div className="mt-1 font-semibold text-slate-900 dark:text-gray-100">{contact?.contact360?.invoices?.length ?? 0}</div>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-3">
                  <div className="text-xs text-slate-500 dark:text-gray-400">Payment status</div>
                  <div className="mt-1 font-semibold text-slate-900 dark:text-gray-100">{overdueInvoices.length > 0 ? `${overdueInvoices.length} open` : 'On track'}</div>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-3">
                  <div className="text-xs text-slate-500 dark:text-gray-400">Same-company contacts</div>
                  <div className="mt-1 font-semibold text-slate-900 dark:text-gray-100">{contact?.contact360?.relatedContacts?.length ?? 0}</div>
                </div>
              </div>
            </div>

            <div data-testid="contact-timeline" className="space-y-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">Timeline Workspace</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {timelineTabs.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setTimelineFilter(tab.key)}
                        className={`text-xs rounded-full px-2 py-1 transition-colors ${
                          timelineFilter === tab.key
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Link href={`/crm/${tenantId}/Tasks/new?contactId=${id}`}>
                  <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Add Activity</Button>
                </Link>
              </div>
              <ContactInfoTimelineCard
                contact={contact}
                tenantId={tenantId}
                contactId={id}
                timelineFilter={timelineFilter}
                onRefetchContact={() => refetch()}
              />
            </div>
          </section>

          {/* Right Column: AI & Actions */}
          <section className="space-y-4">
            <NextBestActionCard contactId={id} tenantId={tenantId} contact={contact} onOpenMoreActions={() => setShowMoreActions(true)} />
            <ContactIntelligenceCard
              contact={contact}
              onOpenNurture={() => setShowNurtureDialog(true)}
              onRescore={handleAiRescore}
              isRescoring={rescoreLoading}
            />
            <AutomationStatusCard contact={contact} />
            <AuditActionTimelineCard entityType="contact" entityId={id} tenantId={tenantId} title="Contact Automation Timeline" />
            <div data-testid="contact-ai-assist">
              <AIAssistCard contact={contact} tenantId={tenantId} onEnriched={() => refetch()} />
            </div>
          </section>
        </div>
      </div>

      {/* Dialogs */}
      {showAllocationDialog && contact.type === 'lead' && (
        <LeadAllocationDialog
          contactId={id}
          contactName={contact.name}
          tenantId={tenantId}
          currentRep={contact.assignedTo ? {
            id: contact.assignedTo.id,
            name: contact.assignedTo.name || contact.assignedTo.user?.name || 'Unknown'
          } : null}
          onAssign={({ repId, repName, repEmail }) => {
            const assignedToPayload = {
              id: repId,
              name: repName,
              user: {
                name: repName,
                email: repEmail || '',
              },
            }
            queryClient.setQueriesData(
              { queryKey: ['contact', id, tenantId] },
              (previous: any) =>
                previous
                  ? {
                      ...previous,
                      assignedTo: assignedToPayload,
                    }
                  : previous
            )
            queryClient.invalidateQueries({ queryKey: ['contact', id, tenantId] })
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            toast.success('Lead reassigned', `${contact.name} is now assigned to ${repName}.`)
            setShowAllocationDialog(false)
          }}
          onClose={() => setShowAllocationDialog(false)}
        />
      )}

      {showNurtureDialog && isProspect && (
        <NurtureSequenceApplier
          contactId={id}
          contactName={contact.name}
          onEnroll={() => {
            queryClient.invalidateQueries({ queryKey: ['contact', id, tenantId] })
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            toast.success('Nurture updated', `${contact.name} was enrolled in a nurture sequence.`)
          }}
          onClose={() => setShowNurtureDialog(false)}
        />
      )}
      {PageToastContainer}
    </div>
  )
}
