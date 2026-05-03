'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useDeal, useUpdateDeal, getAuthHeaders } from '@/lib/hooks/use-api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { PageLoading } from '@/components/ui/loading'
import { FileText, Bot, Trophy, XCircle } from 'lucide-react'
import { DealHealthCard } from '@/components/crm/DealHealthCard'
import { useToast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/lib/stores/auth'

function PlaceholderCard({ title, message }: { title: string; message: string }) {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="dark:text-gray-100">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500 dark:text-gray-400">{message}</p>
      </CardContent>
    </Card>
  )
}

function DealTimeline(_: {
  dealId: string
  tenantId: string
  deal: {
    createdAt: string | Date
    updatedAt: string | Date
    stage: string
    actualCloseDate?: string
    wonReason?: string
    lostReason?: string
    contactId?: string
  }
}) {
  return <PlaceholderCard title="Deal Timeline" message="Detailed timeline is temporarily unavailable in this build." />
}

function AuditActionTimelineCard(_: { entityType: string; entityId: string; tenantId: string; title: string }) {
  return <PlaceholderCard title="Deal Automation Timeline" message="Audit actions are temporarily unavailable." />
}

function DealRevenueInsightCard(_: { dealId: string; tenantId: string; stage: string }) {
  return <PlaceholderCard title="Revenue Insight" message="Revenue insights are temporarily unavailable in this build." />
}

function CloseDealModal({
  outcome,
  onClose,
  onConfirm,
}: {
  outcome: 'won' | 'lost'
  dealName: string
  tenantId: string
  onClose: () => void
  onConfirm: (data: { reason?: string; competitor?: string }) => Promise<void>
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Confirm mark as {outcome}
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Close this deal now? Reason entry is unavailable in this build.
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={async () => {
              await onConfirm({})
            }}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function DealDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const router = useRouter()
  const queryClient = useQueryClient()
  const { tenant } = useAuthStore()
  const { data: deal, isLoading } = useDeal(id, tenantId)
  const updateDeal = useUpdateDeal()
  const [closeModal, setCloseModal] = useState<'won' | 'lost' | null>(null)
  const { toast } = useToast()

  const { data: relatedQuotes } = useQuery({
    queryKey: ['crm', 'quotes', 'deal', id],
    queryFn: async () => {
      const res = await fetch(`/api/crm/cpq/quotes?dealId=${encodeURIComponent(id)}`, { headers: getAuthHeaders() })
      if (!res.ok) return []
      const json = await res.json().catch(() => ({}))
      return (json.quotes || []) as any[]
    },
  })

  const hasFinanceModule = Boolean(tenant?.licensedModules?.includes('finance'))

  if (isLoading) {
    return <PageLoading message="Loading deal..." fullScreen={false} />
  }

  if (!deal) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Deal not found</p>
        <Link href={`/crm/${tenantId}/Deals`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Back to Deals</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* AI entry point: open the page-scoped assistant (same as CRM Home Command Center) */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-page-ai'))}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5"
        >
          <Bot className="w-3.5 h-3.5" />
          Ask PayAid AI about this deal
        </button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{deal.name}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {deal.contact?.name || 'No contact'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={async () => {
              try {
                router.push(`/crm/${tenantId}/Quotes/New?dealId=${encodeURIComponent(id)}`)
              } catch (_) {
                toast({ title: 'Navigation failed', description: 'Could not open quote builder', variant: 'destructive' })
              }
            }}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
          >
            <FileText className="h-4 w-4 mr-2" />
            Create Quote
          </Button>
          {deal.contact && hasFinanceModule && (
            <Link href={`/finance/${tenantId}/Invoices/new?customerId=${deal.contact.id}`}>
              <Button
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                🧾 Create Invoice
              </Button>
            </Link>
          )}
          {deal.contact && !hasFinanceModule && (
            <Button
              variant="outline"
              disabled
              title="Finance module is not enabled for this workspace"
              className="dark:border-gray-600 dark:text-gray-300"
            >
              🧾 Create Invoice (Finance module required)
            </Button>
          )}
          <Link href={`/crm/${tenantId}/Deals`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Back</Button>
          </Link>
          <Link href={`/crm/${tenantId}/Deals/${id}/Edit`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Edit</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Deal Value</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ₹{deal.value.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Probability</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{deal.probability}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Stage</div>
                  <span className="px-3 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 capitalize">
                    {deal.stage}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Expected Value</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    ₹{((deal.value * deal.probability) / 100).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {deal.expectedCloseDate && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Expected Close Date</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(deal.expectedCloseDate), 'MMMM dd, yyyy')}
                  </div>
                </div>
              )}

              {(deal.stage === 'won' || deal.stage === 'lost') && (deal.wonReason ?? deal.lostReason ?? deal.competitor) && (
                <div className="rounded-lg border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-800/50 p-4 space-y-2">
                  {deal.stage === 'won' && deal.wonReason && (
                    <div className="flex items-start gap-2">
                      <Trophy className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs uppercase text-slate-500 dark:text-gray-400">Win reason</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-gray-100">{deal.wonReason}</div>
                      </div>
                    </div>
                  )}
                  {deal.stage === 'lost' && deal.lostReason && (
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs uppercase text-slate-500 dark:text-gray-400">Loss reason</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-gray-100">{deal.lostReason}</div>
                      </div>
                    </div>
                  )}
                  {deal.competitor && (
                    <div>
                      <div className="text-xs uppercase text-slate-500 dark:text-gray-400">Competitor</div>
                      <div className="text-sm font-medium text-slate-900 dark:text-gray-100">{deal.competitor}</div>
                    </div>
                  )}
                </div>
              )}

              {deal.contact && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Contact</div>
                  <Link
                    href={`/crm/${tenantId}/Contacts/${deal.contact.id}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {deal.contact.name}
                  </Link>
                  {deal.contact.email && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">{deal.contact.email}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <DealTimeline
            dealId={id}
            tenantId={tenantId}
            deal={{
              createdAt: deal.createdAt,
              updatedAt: deal.updatedAt,
              stage: deal.stage,
              actualCloseDate: deal.actualCloseDate ?? undefined,
              wonReason: deal.wonReason ?? undefined,
              lostReason: deal.lostReason ?? undefined,
              contactId: deal.contactId ?? undefined,
            }}
          />
        </div>

        <div className="space-y-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {deal.stage !== 'won' && deal.stage !== 'lost' && (
                <>
                  <Button
                    variant="outline"
                    className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => setCloseModal('won')}
                  >
                    Mark as Won
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => setCloseModal('lost')}
                  >
                    Mark as Lost
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <DealHealthCard dealId={id} tenantId={tenantId} />

          <DealRevenueInsightCard dealId={id} tenantId={tenantId} stage={deal.stage} />

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Related Quotes</CardTitle>
              <CardDescription>Quotes linked to this deal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.isArray(relatedQuotes) && relatedQuotes.length > 0 ? (
                <div className="space-y-2">
                  {relatedQuotes.map((q: any) => (
                    <Link
                      key={q.id}
                      href={`/crm/${tenantId}/Quotes/${q.id}`}
                      className="block rounded-lg border border-slate-200 dark:border-gray-700 p-3 hover:bg-slate-50 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-gray-100">{q.quoteNumber}</div>
                          <div className="text-xs text-slate-500 dark:text-gray-400 capitalize">{q.status}</div>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                          ₹{Number(q.total ?? 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-gray-400">No quotes yet. Click “Create Quote”.</p>
              )}
            </CardContent>
          </Card>

          <AuditActionTimelineCard
            entityType="deal"
            entityId={id}
            tenantId={tenantId}
            title="Deal Automation Timeline"
          />
        </div>
      </div>

      {closeModal && (
        <CloseDealModal
          outcome={closeModal}
          dealName={deal.name}
          tenantId={tenantId}
          onClose={() => setCloseModal(null)}
          onConfirm={async ({ reason, competitor: comp }) => {
            await updateDeal.mutateAsync({
              id,
              tenantId,
              data: closeModal === 'won'
                ? { stage: 'won', actualCloseDate: new Date().toISOString(), wonReason: reason, competitor: comp }
                : { stage: 'lost', lostReason: reason, competitor: comp },
            })
            queryClient.invalidateQueries({ queryKey: ['deal', id] })
            queryClient.invalidateQueries({ queryKey: ['deals'] })
            setCloseModal(null)
            toast({
              title: closeModal === 'won' ? 'Deal marked as Won' : 'Deal marked as Lost',
              description: closeModal === 'won' ? 'Congratulations! This deal is closed won.' : 'Deal closed as lost. You can review win/loss reasons in reports.',
            })
          }}
        />
      )}
    </div>
  )
}
