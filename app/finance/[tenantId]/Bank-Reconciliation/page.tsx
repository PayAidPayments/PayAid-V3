'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { Landmark, CheckCircle, Circle, Upload, Loader2 } from 'lucide-react'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { PageLoading } from '@/components/ui/loading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function BankReconciliationPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const queryClient = useQueryClient()
  const moduleConfig = getModuleConfig('finance')

  const { data, isLoading } = useQuery({
    queryKey: ['finance-bank-reconcile', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/finance/bank-reconcile?limit=100', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to load')
      return res.json()
    },
  })

  const markReconciled = useMutation({
    mutationFn: async (transactionId: string) => {
      const res = await fetch(`/api/finance/bank-reconcile/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error('Failed to reconcile')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-bank-reconcile', tenantId] })
    },
  })

  const transactions = data?.transactions ?? []
  const summary = data?.summary ?? { unreconciledCount: 0, reconciledCount: 0, bankAccountsCount: 0 }

  if (!moduleConfig) return <div>Module configuration not found</div>

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Bank Reconciliation"
        moduleIcon={<Landmark className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Match bank statement with ledger transactions"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Unreconciled</p>
                  <p className="text-2xl font-semibold dark:text-gray-100">{summary.unreconciledCount}</p>
                </div>
                <Circle className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reconciled</p>
                  <p className="text-2xl font-semibold dark:text-gray-100">{summary.reconciledCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Bank accounts</p>
                  <p className="text-2xl font-semibold dark:text-gray-100">{summary.bankAccountsCount}</p>
                </div>
                <Landmark className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Transactions</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Mark transactions as reconciled when they match your bank statement. Add bank accounts in Chart of Accounts (subType or name containing &quot;bank&quot;) to see them here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300" disabled>
                <Upload className="h-4 w-4 mr-2" />
                Import statement (coming soon)
              </Button>
            </div>
            {isLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                No bank transactions yet. Create a bank account in Chart of Accounts and post transactions to see them here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Date</TableHead>
                      <TableHead className="dark:text-gray-300">Type</TableHead>
                      <TableHead className="dark:text-gray-300">Description</TableHead>
                      <TableHead className="dark:text-gray-300">Debit</TableHead>
                      <TableHead className="dark:text-gray-300">Credit</TableHead>
                      <TableHead className="dark:text-gray-300">Amount</TableHead>
                      <TableHead className="dark:text-gray-300">Status</TableHead>
                      <TableHead className="dark:text-gray-300">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t: any) => (
                      <TableRow key={t.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <TableCell className="dark:text-gray-200">
                          {new Date(t.transactionDate).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="dark:text-gray-200">{t.transactionType}</TableCell>
                        <TableCell className="dark:text-gray-200">{t.description ?? '—'}</TableCell>
                        <TableCell className="dark:text-gray-200">{t.debitAccount?.accountName ?? '—'}</TableCell>
                        <TableCell className="dark:text-gray-200">{t.creditAccount?.accountName ?? '—'}</TableCell>
                        <TableCell className="dark:text-gray-200">{formatINRForDisplay(t.amount)}</TableCell>
                        <TableCell className="dark:text-gray-200">
                          {t.isReconciled ? (
                            <span className="text-green-600 dark:text-green-400">Reconciled</span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400">Pending</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {!t.isReconciled && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="dark:text-gray-300"
                              disabled={markReconciled.isPending}
                              onClick={() => markReconciled.mutate(t.id)}
                            >
                              {markReconciled.isPending && markReconciled.variables === t.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Mark reconciled'
                              )}
                            </Button>
                          )}
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
