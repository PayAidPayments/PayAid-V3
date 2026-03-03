'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useDeal, useUpdateDeal, getAuthHeaders } from '@/lib/hooks/use-api'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { PageLoading } from '@/components/ui/loading'
import { FileText, Bot, Trophy, XCircle } from 'lucide-react'
import { CloseDealModal } from '@/components/crm/deal/CloseDealModal'
import { DealTimeline } from '@/components/crm/deal/DealTimeline'
import { useToast } from '@/components/ui/use-toast'

export default function DealDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: deal, isLoading } = useDeal(id, tenantId)
  const updateDeal = useUpdateDeal()
  const [closeModal, setCloseModal] = useState<'won' | 'lost' | null>(null)
  const { toast } = useToast()

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
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              try {
                // Navigate to quote generation page or open modal
                const response = await fetch(`/api/quotes`, {
                  method: 'POST',
                  headers: getAuthHeaders(),
                  body: JSON.stringify({
                    dealId: id,
                    lineItems: [
                      {
                        productName: deal.name,
                        quantity: 1,
                        unitPrice: deal.value,
                      },
                    ],
                  }),
                })
                if (response.ok) {
                  const data = await response.json()
                  router.push(`/crm/${tenantId}/Quotes/${data.data.id}`)
                } else {
                  alert('Failed to generate quote. Please try again.')
                }
              } catch (error) {
                console.error('Error generating quote:', error)
                alert('Failed to generate quote')
              }
            }}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Quote
          </Button>
          {deal.contact && (
            <Link href={`/finance/${tenantId}/Invoices/new?customerId=${deal.contact.id}`}>
              <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600">
                🧾 Create Invoice
              </Button>
            </Link>
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
        </div>
      </div>

      {closeModal && (
        <CloseDealModal
          outcome={closeModal}
          dealName={deal.name}
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
