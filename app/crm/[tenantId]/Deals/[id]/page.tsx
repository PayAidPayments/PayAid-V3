'use client'

import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useDeal, useUpdateDeal } from '@/lib/hooks/use-api'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { PageLoading } from '@/components/ui/loading'
import { FileText } from 'lucide-react'

export default function DealDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: deal, isLoading } = useDeal(id)
  const updateDeal = useUpdateDeal()

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
                  headers: { 'Content-Type': 'application/json' },
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
        </div>

        <div className="space-y-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={async () => {
                  if (confirm('Mark this deal as won?')) {
                    try {
                      await updateDeal.mutateAsync({ id, data: { stage: 'won', actualCloseDate: new Date().toISOString() } })
                      queryClient.invalidateQueries({ queryKey: ['deal', id] })
                      queryClient.invalidateQueries({ queryKey: ['deals'] })
                    } catch (error) {
                      alert('Failed to update deal')
                    }
                  }
                }}
              >
                Mark as Won
              </Button>
              <Button
                variant="outline"
                className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={async () => {
                  if (confirm('Mark this deal as lost?')) {
                    try {
                      await updateDeal.mutateAsync({ id, data: { stage: 'lost' } })
                      queryClient.invalidateQueries({ queryKey: ['deal', id] })
                      queryClient.invalidateQueries({ queryKey: ['deals'] })
                    } catch (error) {
                      alert('Failed to update deal')
                    }
                  }
                }}
              >
                Mark as Lost
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
