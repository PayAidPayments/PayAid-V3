'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

export default function NewJournalEntryPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const createJournalEntryIdempotencyKey = useMemo(
    () =>
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? `finance:je:create:${crypto.randomUUID()}`
        : 'finance:je:create:fallback',
    []
  )
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [debitAccountId, setDebitAccountId] = useState('')
  const [creditAccountId, setCreditAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')

  const { data: accountsData } = useQuery({
    queryKey: ['chart-of-accounts', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/finance/chart-of-accounts', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to load accounts')
      return res.json()
    },
  })
  const accounts = accountsData?.accounts ?? []

  const createMutation = useMutation({
    mutationFn: async () => {
      const num = parseFloat(amount)
      if (isNaN(num) || num <= 0) throw new Error('Enter a valid amount')
      const res = await fetch('/api/finance/journal-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': createJournalEntryIdempotencyKey,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          transactionDate,
          debitAccountId,
          creditAccountId,
          amount: num,
          description: description || undefined,
          referenceNumber: referenceNumber || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create journal entry')
      }
      return res.json()
    },
    onSuccess: () => {
      router.push(`/finance/${tenantId}/Accounting/Journal-Entries`)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/finance/${tenantId}/Accounting/Journal-Entries`} className={createMutation.isPending ? 'pointer-events-none opacity-50' : ''}>
          <Button variant="outline" size="icon" className="dark:border-gray-600 dark:text-gray-300" disabled={createMutation.isPending} title={createMutation.isPending ? 'Please wait' : 'Back to list'}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New journal entry</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Debit one account, credit another — amounts must balance</p>
        </div>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Entry details</CardTitle>
          <CardDescription className="dark:text-gray-400">Select debit and credit accounts from your Chart of Accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="dark:text-gray-300">Date</Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">Amount (INR)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>
          <div>
            <Label className="dark:text-gray-300">Debit account</Label>
            <select
              value={debitAccountId}
              onChange={(e) => setDebitAccountId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2"
            >
              <option value="">Select account</option>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>{a.accountCode} – {a.accountName}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="dark:text-gray-300">Credit account</Label>
            <select
              value={creditAccountId}
              onChange={(e) => setCreditAccountId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2"
            >
              <option value="">Select account</option>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>{a.accountCode} – {a.accountName}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="dark:text-gray-300">Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Office rent adjustment"
              className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          <div>
            <Label className="dark:text-gray-300">Reference (optional)</Label>
            <Input
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. INV-001"
              className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !debitAccountId || !creditAccountId || !amount}
              className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              title={createMutation.isPending ? 'Please wait' : 'Create journal entry'}
            >
              {createMutation.isPending ? 'Creating…' : 'Create entry'}
            </Button>
            <Link href={`/finance/${tenantId}/Accounting/Journal-Entries`}>
              <Button
                variant="outline"
                className="dark:border-gray-600 dark:text-gray-300"
                disabled={createMutation.isPending}
                title={createMutation.isPending ? 'Please wait' : 'Cancel and return'}
              >
                Cancel
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
