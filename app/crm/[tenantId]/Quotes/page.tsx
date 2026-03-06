/**
 * Quotes Management Page
 */

'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Loader2, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { getAuthHeaders } from '@/lib/hooks/use-api'

export default function QuotesPage() {
  const params = useParams()
  const tenantId = params.tenantId as string

  const { data, isLoading } = useQuery({
    queryKey: ['crm', 'quotes', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/crm/cpq/quotes', { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Failed to fetch quotes')
      const json = await res.json()
      return (json.quotes || []) as any[]
    },
  })

  const quotes = data ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-gray-100">Quotes</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Manage sales quotes and proposals
          </p>
        </div>
        <Button asChild>
          <Link href={`/crm/${tenantId}/Deals`}>
            <Plus className="h-4 w-4 mr-2" />
            Create quote (from deal)
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : quotes.length === 0 ? (
        <Card className="border border-slate-200 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-slate-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-2">No quotes yet</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
              Create a quote from a deal: open a deal and click &quot;Create Quote&quot;.
            </p>
            <Button asChild>
              <Link href={`/crm/${tenantId}/Deals`}>
                <Briefcase className="h-4 w-4 mr-2" />
                Go to Deals
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <Card key={quote.id} className="border border-slate-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{quote.quoteNumber}</CardTitle>
                    <CardDescription className="mt-1">
                      {quote.contact?.name || 'No contact'} • Deal: {quote.deal?.name || 'N/A'}
                    </CardDescription>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    quote.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                    quote.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                    quote.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                  }`}>
                    {quote.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-slate-900 dark:text-gray-100">
                      ₹{Number(quote.total ?? 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      {quote.lineItems?.length || 0} line item(s)
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/crm/${tenantId}/Deals/${quote.deal?.id || ''}`}>
                      View deal
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
