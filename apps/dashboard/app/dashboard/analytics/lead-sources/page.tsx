'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface LeadSource {
  id: string
  name: string
  type: string
  leadsCount: number
  conversionsCount: number
  conversionRate: string
  avgDealValue: number
  totalValue: number
  roi: string
}

export default function LeadSourcesPage() {
  const { data, isLoading } = useQuery<{ sources: LeadSource[] }>({
    queryKey: ['lead-sources'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/lead-sources')
      if (!response.ok) throw new Error('Failed to fetch lead sources')
      return response.json()
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const sources = data?.sources || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lead Source ROI</h1>
        <p className="mt-2 text-gray-600">Track which sources generate the best leads</p>
      </div>

      {/* Source Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sources.map((source) => (
          <Card key={source.id}>
            <CardHeader>
              <CardTitle className="text-lg">{source.name}</CardTitle>
              <CardDescription className="capitalize">{source.type}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-gray-600">Conversion Rate</div>
                <div className="text-2xl font-bold">{source.conversionRate}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Avg Deal Value</div>
                <div className="text-lg font-semibold">
                  ₹{((source.avgDealValue || 0) / 100000).toFixed(1)}L
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">ROI</div>
                <div
                  className={`font-semibold ${
                    parseFloat(source.roi) > 300 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {source.roi}
                </div>
              </div>
              <div className="pt-2 border-t text-xs text-gray-500">
                {source.leadsCount} leads • {source.conversionsCount} conversions
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Source Performance</CardTitle>
          <CardDescription>Detailed ROI analysis by source</CardDescription>
        </CardHeader>
        <CardContent>
          {sources.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No lead sources tracked yet. Sources are automatically created when leads are imported or created.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Conversion Rate</TableHead>
                  <TableHead>Avg Deal Value</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell className="capitalize">{source.type}</TableCell>
                    <TableCell>{source.leadsCount}</TableCell>
                    <TableCell>{source.conversionsCount}</TableCell>
                    <TableCell>{source.conversionRate}</TableCell>
                    <TableCell>
                      ₹{((source.avgDealValue || 0) / 100000).toFixed(1)}L
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₹{((source.totalValue || 0) / 100000).toFixed(1)}L
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          parseFloat(source.roi) > 300
                            ? 'text-green-600 font-semibold'
                            : 'text-red-600'
                        }
                      >
                        {source.roi}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
