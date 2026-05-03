'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileText, Loader2 } from 'lucide-react'
import { getAuthHeaders } from '@/lib/hooks/use-api'

export default function QuoteDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string

  const { data, isLoading } = useQuery({
    queryKey: ['crm', 'quote', id],
    queryFn: async () => {
      const res = await fetch(`/api/crm/cpq/quotes/${id}`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Failed to fetch quote')
      const json = await res.json()
      return json.quote as any
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-slate-400 dark:text-gray-500 mb-4" />
            <p className="text-slate-600 dark:text-gray-400 mb-4">Quote not found.</p>
            <Button asChild variant="outline">
              <Link href={`/crm/${tenantId}/Quotes`}>Back to Quotes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const quote = data

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/crm/${tenantId}/Quotes`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-gray-100">{quote.quoteNumber}</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            {quote.deal?.name && (
              <>
                Deal: <Link href={`/crm/${tenantId}/Deals/${quote.deal.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{quote.deal.name}</Link>
              </>
            )}
          </p>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-base">Quote details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-gray-400">Status</span>
            <span className="font-medium capitalize">{quote.status}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-gray-400">Total</span>
            <span className="font-semibold">₹{Number(quote.total ?? 0).toLocaleString('en-IN')}</span>
          </div>
          {quote.contact && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-gray-400">Contact</span>
              <span>{quote.contact.name}</span>
            </div>
          )}
          {quote.deal?.id && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/crm/${tenantId}/Deals/${quote.deal.id}`}>View deal</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
