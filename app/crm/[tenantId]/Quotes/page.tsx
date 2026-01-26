/**
 * Quotes Management Page
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText } from 'lucide-react'
import Link from 'next/link'

export default function QuotesPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuotes()
  }, [tenantId])

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes')
      const data = await response.json()
      if (data.success) {
        setQuotes(data.data)
      }
    } catch (error) {
      console.error('Error fetching quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Quotes</h1>
          <p className="text-muted-foreground mt-2">
            Manage sales quotes and proposals
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Quote
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : quotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No quotes yet</h3>
            <Button>Create Quote</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <Card key={quote.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{quote.quoteNumber}</CardTitle>
                    <CardDescription>
                      {quote.contact?.name || 'No contact'} • Deal: {quote.deal?.name || 'N/A'}
                    </CardDescription>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {quote.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">₹{quote.total?.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {quote.lineItems?.length || 0} line items
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={`/crm/${tenantId}/Quotes/${quote.id}`}>
                      View Details
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
