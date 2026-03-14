'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { FileText, Plus, Undo2 } from 'lucide-react'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { PageLoading } from '@/components/ui/loading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function JournalEntriesPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const queryClient = useQueryClient()
  const moduleConfig = getModuleConfig('finance')

  const { data, isLoading } = useQuery({
    queryKey: ['finance-journal-entries', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/finance/journal-entries?limit=100', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to load')
      return res.json()
    },
  })

  const reverseMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const res = await fetch(`/api/finance/journal-entries/${entryId}/reverse`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to reverse')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-journal-entries', tenantId] })
    },
  })

  const entries = data?.journalEntries ?? []

  if (!moduleConfig) return <div>Module configuration not found</div>

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Journal Entries"
        moduleIcon={<FileText className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Manual double-entry bookkeeping"
      />

      <div className="p-6 space-y-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Entries</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Create and view manual journal entries (numbered JE-YYYY-NNNN). Debit and credit must balance. Use Reverse to create an offsetting entry.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Link href={`/finance/${tenantId}/Accounting/Journal-Entries/new`}>
                <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                  <Plus className="h-4 w-4 mr-2" />
                  New journal entry
                </Button>
              </Link>
            </div>
            {isLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">Loading...</p>
            ) : entries.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                No journal entries yet. Ensure Chart of Accounts is set up, then create an entry.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Code</TableHead>
                      <TableHead className="dark:text-gray-300">Date</TableHead>
                      <TableHead className="dark:text-gray-300">Description</TableHead>
                      <TableHead className="dark:text-gray-300">Debit</TableHead>
                      <TableHead className="dark:text-gray-300">Credit</TableHead>
                      <TableHead className="dark:text-gray-300">Amount</TableHead>
                      <TableHead className="dark:text-gray-300 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((e: any) => (
                      <TableRow key={e.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <TableCell className="dark:text-gray-200 font-mono">{e.transactionCode ?? '—'}</TableCell>
                        <TableCell className="dark:text-gray-200">
                          {new Date(e.transactionDate).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="dark:text-gray-200">{e.description ?? '—'}</TableCell>
                        <TableCell className="dark:text-gray-200">{e.debitAccount?.accountName ?? '—'}</TableCell>
                        <TableCell className="dark:text-gray-200">{e.creditAccount?.accountName ?? '—'}</TableCell>
                        <TableCell className="dark:text-gray-200">{formatINRForDisplay(e.amount)}</TableCell>
                        <TableCell className="dark:text-gray-200 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="dark:border-gray-600 dark:text-gray-300"
                            disabled={reverseMutation.isPending}
                            onClick={() => reverseMutation.mutate(e.id)}
                            title="Create reversing entry"
                          >
                            {reverseMutation.isPending && reverseMutation.variables === e.id ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              <>
                                <Undo2 className="h-4 w-4 mr-1" />
                                Reverse
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
