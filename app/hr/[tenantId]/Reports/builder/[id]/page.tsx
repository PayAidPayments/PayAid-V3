'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Download, Play, Loader2 } from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'

export default function ReportBuilderDetailPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const id = params?.id as string
  const { token } = useAuthStore()
  const [generated, setGenerated] = useState<{ data: any[]; summary: any; reportName: string } | null>(null)

  const { data: report, isLoading } = useQuery({
    queryKey: ['custom-report', id],
    queryFn: async () => {
      const res = await fetch(`/api/hr/reports/builder/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Report not found')
      return res.json()
    },
  })

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/hr/reports/builder/${id}/generate`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to generate report')
      return res.json()
    },
    onSuccess: (data) => {
      setGenerated({ data: data.data || [], summary: data.summary || {}, reportName: data.reportName || '' })
    },
  })

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const res = await fetch(`/api/hr/reports/builder/${id}/export?format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition')
      const match = disposition?.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] || `report.${format === 'xlsx' ? 'xlsx' : 'csv'}`
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      console.error(e)
    }
  }

  if (isLoading) {
    return <PageLoading message="Loading report..." fullScreen={false} />
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Report not found</p>
        <Link href={`/hr/${tenantId}/Reports`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300">Back to Reports</Button>
        </Link>
      </div>
    )
  }

  const rows = generated?.data ?? []
  const cols = rows.length > 0 ? Object.keys(rows[0]) : []
  const isGrouped = rows.length > 0 && rows[0]?.data !== undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/hr/${tenantId}/Reports`}>
            <Button variant="outline" size="icon" className="dark:border-gray-600 dark:text-gray-300">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{report.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {report.description || report.reportType} • Custom report
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Run report
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('xlsx')}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {generated && generated.summary && Object.keys(generated.summary).length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
              {JSON.stringify(generated.summary, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Data</CardTitle>
          <CardDescription className="dark:text-gray-400">
            {generated
              ? `${rows.length} row(s)`
              : 'Click "Run report" to generate data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!generated ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              Run the report to see data here. You can also export directly to CSV.
            </p>
          ) : isGrouped ? (
            <div className="space-y-4">
              {(rows as any[]).map((group: any, i: number) => (
                <div key={i}>
                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {group.group} ({group.count})
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-gray-700">
                        {group.data?.[0] && Object.keys(group.data[0]).map((c) => (
                          <TableHead key={c} className="dark:text-gray-300">{c}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(group.data || []).map((row: any, j: number) => (
                        <TableRow key={j} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                          {Object.values(row).map((v: any, k: number) => (
                            <TableCell key={k} className="dark:text-gray-200">
                              {v != null ? String(v) : '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">No rows returned.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    {cols.map((c) => (
                      <TableHead key={c} className="dark:text-gray-300 whitespace-nowrap">{c}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 500).map((row: any, i: number) => (
                    <TableRow key={i} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                      {cols.map((c) => (
                        <TableCell key={c} className="dark:text-gray-200">
                          {row[c] != null ? String(row[c]) : '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length > 500 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Showing first 500 of {rows.length} rows. Export CSV for full data.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
