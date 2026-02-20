'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Filter, Calendar, Activity } from 'lucide-react'
import { format } from 'date-fns'

interface AuditLog {
  id: string
  type: string
  action: string
  metadata: any
  createdAt: string
  userId?: string
  userName?: string
}

export default function AuditTrailPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('7d')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-trail', typeFilter, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        params.append('startDate', startDate.toISOString())
      }

      const res = await fetch(`/api/ai/governance/audit-trail?${params.toString()}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Failed to load audit trail')
      return res.json()
    },
  })

  const filteredLogs = data?.logs?.filter((log: AuditLog) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      log.action?.toLowerCase().includes(query) ||
      log.type?.toLowerCase().includes(query) ||
      log.userName?.toLowerCase().includes(query)
    )
  }) || []

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="h-7 w-7 text-purple-600" />
          AI Audit Trail
        </h1>
        <p className="text-gray-600 mt-1">
          View all AI actions, decisions, and data access logs
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search actions, types, users..."
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="workflow">Workflow</option>
                <option value="insight">Insight</option>
                <option value="query">Query</option>
                <option value="action">Action</option>
              </select>
            </div>
            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <select
                id="dateRange"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading audit trail...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No audit logs found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} found
            </h2>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>

          {filteredLogs.map((log: AuditLog) => (
            <Card key={log.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-700">
                        {log.type}
                      </span>
                      <span className="font-semibold">{log.action}</span>
                    </div>
                    {log.userName && (
                      <div className="text-sm text-gray-600 mb-2">
                        User: {log.userName}
                      </div>
                    )}
                    {log.metadata && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                          View Details
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
