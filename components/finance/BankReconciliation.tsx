'use client'

import { useState } from 'react'
import { Upload, RefreshCw, CheckCircle, XCircle, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface BankTransaction {
  id: string
  date: Date
  description: string
  amount: number
  type: 'credit' | 'debit'
  status: 'matched' | 'unmatched' | 'pending'
  matchedWith?: string
}

interface BankReconciliationProps {
  tenantId: string
}

export function BankReconciliation({ tenantId }: BankReconciliationProps) {
  const [transactions, setTransactions] = useState<BankTransaction[]>([
    {
      id: '1',
      date: new Date('2026-01-10'),
      description: 'Payment from ABC Corp',
      amount: 50000,
      type: 'credit',
      status: 'matched',
      matchedWith: 'INV-001',
    },
    {
      id: '2',
      date: new Date('2026-01-11'),
      description: 'Vendor Payment - XYZ Ltd',
      amount: 30000,
      type: 'debit',
      status: 'matched',
      matchedWith: 'PO-123',
    },
    {
      id: '3',
      date: new Date('2026-01-12'),
      description: 'Bank Charges',
      amount: 500,
      type: 'debit',
      status: 'unmatched',
    },
    {
      id: '4',
      date: new Date('2026-01-13'),
      description: 'Interest Income',
      amount: 1000,
      type: 'credit',
      status: 'pending',
    },
  ])

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // API call to import bank statement
      alert(`Importing ${file.name}...`)
    }
  }

  const handleAutoMatch = async () => {
    // API call to auto-match transactions
    alert('Auto-matching transactions...')
    setTransactions(prev => prev.map(t => 
      t.status === 'unmatched' ? { ...t, status: 'pending' } : t
    ))
  }

  const handleManualMatch = (transactionId: string, matchWith: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === transactionId 
        ? { ...t, status: 'matched', matchedWith: matchWith }
        : t
    ))
  }

  const matchedCount = transactions.filter(t => t.status === 'matched').length
  const unmatchedCount = transactions.filter(t => t.status === 'unmatched').length
  const pendingCount = transactions.filter(t => t.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bank Reconciliation</h2>
          <p className="text-gray-500">Reconcile bank statements with your records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAutoMatch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Auto Match
          </Button>
          <label>
            <Button variant="default" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import Statement
              </span>
            </Button>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Reconciliation Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Matched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success mb-2">{matchedCount}</div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <CheckCircle className="w-4 h-4" />
              Transactions matched
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Unmatched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning mb-2">{unmatchedCount}</div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <AlertCircle className="w-4 h-4" />
              Requires attention
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-info mb-2">{pendingCount}</div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <RefreshCw className="w-4 h-4" />
              Under review
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Transactions List */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Bank Transactions</CardTitle>
          <CardDescription>Review and match transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-gray-500">
                        {transaction.date.toLocaleDateString()}
                      </div>
                    </div>
                    <Badge 
                      variant={
                        transaction.status === 'matched' ? 'default' :
                        transaction.status === 'unmatched' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {transaction.status}
                    </Badge>
                    {transaction.matchedWith && (
                      <Badge variant="outline">
                        Matched: {transaction.matchedWith}
                      </Badge>
                    )}
                  </div>
                  <div className={`text-lg font-semibold ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}
                    {formatINRForDisplay(transaction.amount)}
                  </div>
                </div>
                {transaction.status === 'unmatched' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualMatch(transaction.id, 'Manual Match')}
                  >
                    Match Manually
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </GlassCard>
    </div>
  )
}
