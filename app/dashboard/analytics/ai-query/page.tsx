'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Send, BarChart3, PieChart, TrendingUp } from 'lucide-react'

export default function AIQueryPage() {
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<Array<{ query: string; answer: string; data: any }>>([])

  const queryMutation = useMutation({
    mutationFn: async (q: string) => {
      const res = await fetch('/api/ai/analytics/nl-query', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ query: q }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Query failed')
      }
      return res.json()
    },
    onSuccess: (data) => {
      setHistory((prev) => [{ query, answer: data.answer, data }, ...prev])
      setQuery('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      queryMutation.mutate(query.trim())
    }
  }

  const exampleQueries = [
    "What's my total revenue?",
    'How many contacts do I have?',
    'Show me overdue invoices',
    'What is my pipeline value?',
    'Revenue this month vs last month',
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-purple-600" />
          AI Analytics Query
        </h1>
        <p className="text-gray-600 mt-1">
          Ask questions about your business data in plain English
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
          <CardDescription>Get instant insights from your data</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., What's my total revenue this month?"
                className="flex-1"
                disabled={queryMutation.isPending}
              />
              <Button type="submit" disabled={!query.trim() || queryMutation.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((example) => (
                <Button
                  key={example}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {queryMutation.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">
              {queryMutation.error instanceof Error
                ? queryMutation.error.message
                : 'Query failed'}
            </p>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <div className="space-y-4">
          {history.map((item, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{item.query}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-gray-700">{item.answer}</div>
                {item.data && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    {item.data.chartType === 'bar' && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BarChart3 className="h-4 w-4" />
                        <span>Bar chart data available</span>
                      </div>
                    )}
                    {item.data.chartType === 'pie' && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <PieChart className="h-4 w-4" />
                        <span>Pie chart data available</span>
                      </div>
                    )}
                    {item.data.chartType === 'table' && item.data.invoices && (
                      <div className="mt-2">
                        <div className="text-sm font-semibold mb-2">Overdue Invoices:</div>
                        <div className="space-y-1">
                          {item.data.invoices.slice(0, 5).map((inv: any, idx: number) => (
                            <div key={idx} className="text-xs">
                              {inv.invoiceNumber} - {inv.customerName} - ₹{Number(inv.total).toLocaleString('en-IN')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.data.total !== undefined && (
                      <div className="flex items-center gap-2 mt-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-lg font-semibold">
                          ₹{Number(item.data.total).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
