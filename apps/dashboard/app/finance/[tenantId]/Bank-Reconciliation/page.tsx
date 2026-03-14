'use client'

import { useState, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Landmark, CheckCircle, Circle, Upload, Loader2, Link2 } from 'lucide-react'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { PageLoading } from '@/components/ui/loading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function BankReconciliationPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const queryClient = useQueryClient()
  const moduleConfig = getModuleConfig('finance')
  const [selectedBankId, setSelectedBankId] = useState<string>('all')
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [matchModalLine, setMatchModalLine] = useState<{ id: string; description?: string; debitAmount: number; creditAmount: number } | null>(null)
  const [matchPendingTxId, setMatchPendingTxId] = useState<string | null>(null)
  const [matchAmountMismatch, setMatchAmountMismatch] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['finance-bank-reconcile', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/finance/bank-reconcile?limit=200', {
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

  const rawTransactions = data?.transactions ?? []
  const summary = data?.summary ?? { unreconciledCount: 0, reconciledCount: 0, bankAccountsCount: 0 }
  const apiBankAccounts = data?.bankAccounts ?? []

  const bankAccounts = useMemo(() => {
    if (apiBankAccounts.length > 0) return apiBankAccounts
    const set = new Map<string, { id: string; name: string }>()
    rawTransactions.forEach((t: any) => {
      const debitId = t.debitAccount?.id
      const creditId = t.creditAccount?.id
      if (debitId && t.debitAccount?.accountName?.toLowerCase().includes('bank')) {
        set.set(debitId, { id: debitId, name: `${t.debitAccount.accountCode} – ${t.debitAccount.accountName}` })
      }
      if (creditId && t.creditAccount?.accountName?.toLowerCase().includes('bank')) {
        set.set(creditId, { id: creditId, name: `${t.creditAccount.accountCode} – ${t.creditAccount.accountName}` })
      }
    })
    return Array.from(set.values())
  }, [apiBankAccounts, rawTransactions])

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      if (selectedBankId && selectedBankId !== 'all') form.append('bankAccountId', selectedBankId)
      const res = await fetch('/api/finance/bank-reconcile/import', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || data.parseErrors?.[0] || 'Upload failed')
      return data
    },
    onSuccess: (data) => {
      setImportMessage(data.lineCount != null
        ? `Imported ${data.lineCount} line(s) from ${data.fileName}. Match to ledger below.`
        : `${data.message} File: ${data.fileName}.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      queryClient.invalidateQueries({ queryKey: ['finance-bank-reconcile', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['finance-bank-statement-lines', tenantId, selectedBankId] })
      queryClient.invalidateQueries({ queryKey: ['finance-bank-imports', tenantId] })
      setTimeout(() => setImportMessage(null), 8000)
    },
    onError: (err: Error) => {
      setImportMessage(err.message)
      setTimeout(() => setImportMessage(null), 6000)
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) importMutation.mutate(file)
  }

  const { data: statementLinesData } = useQuery({
    queryKey: ['finance-bank-statement-lines', tenantId, selectedBankId],
    queryFn: async () => {
      if (!selectedBankId || selectedBankId === 'all') return { statementLines: [] }
      const res = await fetch(`/api/finance/bank-reconcile/statement-lines?bankAccountId=${selectedBankId}&limit=200`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return { statementLines: [] }
      return res.json()
    },
    enabled: !!token && !!selectedBankId && selectedBankId !== 'all',
  })
  const statementLines = statementLinesData?.statementLines ?? []

  const transactions = useMemo(() => {
    if (selectedBankId === 'all') return rawTransactions
    return rawTransactions.filter(
      (t: any) => t.debitAccount?.id === selectedBankId || t.creditAccount?.id === selectedBankId
    )
  }, [rawTransactions, selectedBankId])

  const unreconciledTransactions = useMemo(
    () => transactions.filter((t: any) => !t.isReconciled),
    [transactions]
  )

  const matchMutation = useMutation({
    mutationFn: async ({
      lineId,
      transactionId,
      confirmAmountMismatch,
    }: {
      lineId: string
      transactionId: string
      confirmAmountMismatch?: boolean
    }) => {
      const res = await fetch(`/api/finance/bank-reconcile/statement-lines/${lineId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ transactionId, confirmAmountMismatch }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.allowConfirm && !confirmAmountMismatch) {
          setMatchPendingTxId(transactionId)
          setMatchAmountMismatch(true)
        }
        throw new Error(data.error || 'Match failed')
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-bank-reconcile', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['finance-bank-statement-lines', tenantId, selectedBankId] })
      setMatchModalLine(null)
      setMatchPendingTxId(null)
      setMatchAmountMismatch(false)
    },
  })

  const unmatchMutation = useMutation({
    mutationFn: async (lineId: string) => {
      const res = await fetch(`/api/finance/bank-reconcile/statement-lines/${lineId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ unmatch: true }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Unmatch failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-bank-reconcile', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['finance-bank-statement-lines', tenantId, selectedBankId] })
    },
  })

  const handleMatchConfirm = () => {
    if (!matchModalLine || !matchPendingTxId) return
    matchMutation.mutate({
      lineId: matchModalLine.id,
      transactionId: matchPendingTxId,
      confirmAmountMismatch: true,
    })
  }

  const closeMatchModal = () => {
    setMatchModalLine(null)
    setMatchPendingTxId(null)
    setMatchAmountMismatch(false)
  }

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
              Mark transactions as reconciled when they match your bank statement. Add bank accounts in Chart of Accounts (subType or name containing &quot;bank&quot;) to see them here. Multi-bank: filter by account below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2 text-sm"
              >
                <option value="all">All bank accounts</option>
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.ofx"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                size="sm"
                className="dark:border-gray-600 dark:text-gray-300"
                disabled={importMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
                title="Upload CSV with columns: Date, Description/Narration, Debit, Credit (optional: Reference, Balance)"
              >
                {importMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Import statement
              </Button>
              {importMessage && (
                <span className="text-xs text-gray-600 dark:text-gray-300 max-w-md">
                  {importMessage}
                </span>
              )}
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

        {statementLines.length > 0 && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Imported statement lines</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Lines from your uploaded CSV or OFX. Match each line to a ledger transaction above.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Date</TableHead>
                      <TableHead className="dark:text-gray-300">Description</TableHead>
                      <TableHead className="dark:text-gray-300">Reference</TableHead>
                      <TableHead className="dark:text-gray-300 text-right">Debit</TableHead>
                      <TableHead className="dark:text-gray-300 text-right">Credit</TableHead>
                      <TableHead className="dark:text-gray-300 text-right">Balance</TableHead>
                      <TableHead className="dark:text-gray-300 text-right">Match</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statementLines.slice(0, 100).map((l: any) => (
                      <TableRow key={l.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <TableCell className="dark:text-gray-200">
                          {new Date(l.transactionDate).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="dark:text-gray-200 max-w-[200px] truncate" title={l.description ?? ''}>
                          {l.description ?? '—'}
                        </TableCell>
                        <TableCell className="dark:text-gray-200">{l.referenceNumber ?? '—'}</TableCell>
                        <TableCell className="dark:text-gray-200 text-right">
                          {l.debitAmount > 0 ? formatINRForDisplay(l.debitAmount) : '—'}
                        </TableCell>
                        <TableCell className="dark:text-gray-200 text-right">
                          {l.creditAmount > 0 ? formatINRForDisplay(l.creditAmount) : '—'}
                        </TableCell>
                        <TableCell className="dark:text-gray-200 text-right">
                          {l.balanceAfter != null ? formatINRForDisplay(l.balanceAfter) : '—'}
                        </TableCell>
                        <TableCell className="dark:text-gray-200 text-right">
                          {l.matchedTransactionId ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 dark:text-green-400"
                              disabled={unmatchMutation.isPending}
                              onClick={() => unmatchMutation.mutate(l.id)}
                              title="Unmatch from ledger"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Matched
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="dark:border-gray-600 dark:text-gray-300"
                              onClick={() => setMatchModalLine({ id: l.id, description: l.description, debitAmount: l.debitAmount, creditAmount: l.creditAmount })}
                              title="Match to a ledger transaction"
                            >
                              <Link2 className="h-4 w-4 mr-1" />
                              Match
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {statementLines.length > 100 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Showing first 100 of {statementLines.length} lines.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={!!matchModalLine} onOpenChange={(open) => !open && closeMatchModal()}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-100">Match to ledger transaction</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                {matchModalLine && (
                  <>
                    Statement line: {matchModalLine.description || '—'} (
                    {matchModalLine.debitAmount > 0 ? formatINRForDisplay(matchModalLine.debitAmount) : formatINRForDisplay(matchModalLine.creditAmount)})
                  </>
                )}
                Select a ledger transaction below to match. Amounts should match; you can confirm anyway if they differ.
              </DialogDescription>
            </DialogHeader>
            {matchAmountMismatch && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-700 dark:text-amber-300">
                Amounts differ. Match anyway?
                <Button
                  size="sm"
                  className="ml-2"
                  onClick={handleMatchConfirm}
                  disabled={matchMutation.isPending}
                >
                  Yes, match
                </Button>
              </div>
            )}
            <div className="max-h-64 overflow-y-auto">
              {unreconciledTransactions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                  No unreconciled ledger transactions for this bank. Mark transactions as reconciled from the table above, or add journal entries first.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Date</TableHead>
                      <TableHead className="dark:text-gray-300">Description</TableHead>
                      <TableHead className="dark:text-gray-300 text-right">Amount</TableHead>
                      <TableHead className="dark:text-gray-300 w-20">Select</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unreconciledTransactions.slice(0, 50).map((t: any) => (
                      <TableRow
                        key={t.id}
                        className="dark:border-gray-700 dark:hover:bg-gray-700/50 cursor-pointer"
                        onClick={() =>
                          !matchAmountMismatch &&
                          matchModalLine &&
                          matchMutation.mutate({ lineId: matchModalLine.id, transactionId: t.id })
                        }
                      >
                        <TableCell className="dark:text-gray-200">
                          {new Date(t.transactionDate).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="dark:text-gray-200 truncate max-w-[180px]" title={t.description ?? ''}>
                          {t.description ?? t.transactionType ?? '—'}
                        </TableCell>
                        <TableCell className="dark:text-gray-200 text-right">{formatINRForDisplay(t.amount)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={matchMutation.isPending}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (matchModalLine) matchMutation.mutate({ lineId: matchModalLine.id, transactionId: t.id })
                            }}
                          >
                            Match
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300" onClick={closeMatchModal}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
