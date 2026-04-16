'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

export default function NewAdvancePage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const createAdvanceIdempotencyKey = useMemo(
    () =>
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? `finance:advance:create:${crypto.randomUUID()}`
        : 'finance:advance:create:fallback',
    []
  )
  const [type, setType] = useState<'TO_VENDOR' | 'FROM_CUSTOMER'>('TO_VENDOR')
  const [amount, setAmount] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [contactId, setContactId] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')

  const createMutation = useMutation({
    mutationFn: async () => {
      const num = parseFloat(amount)
      if (isNaN(num) || num <= 0) throw new Error('Enter a valid amount')
      const body: any = { type, amount: num, referenceNumber: referenceNumber || undefined, notes: notes || undefined }
      if (type === 'TO_VENDOR') body.vendorId = vendorId || undefined
      else body.contactId = contactId || undefined
      const res = await fetch('/api/finance/advances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': createAdvanceIdempotencyKey,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create advance')
      }
      return res.json()
    },
    onSuccess: () => {
      router.push(`/finance/${tenantId}/Advances`)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/finance/${tenantId}/Advances`} className={createMutation.isPending ? 'pointer-events-none opacity-50' : ''}>
          <Button variant="outline" size="icon" className="dark:border-gray-600 dark:text-gray-300" disabled={createMutation.isPending} title={createMutation.isPending ? 'Please wait' : 'Back to list'}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New advance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Record advance payment to vendor or advance receipt from customer</p>
        </div>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Details</CardTitle>
          <CardDescription className="dark:text-gray-400">Type and amount are required</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="dark:text-gray-300">Type</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'TO_VENDOR' | 'FROM_CUSTOMER')}
              className="mt-1 w-full rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2"
            >
              <option value="TO_VENDOR">Advance to vendor</option>
              <option value="FROM_CUSTOMER">Advance from customer</option>
            </select>
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
          {type === 'TO_VENDOR' && (
            <div>
              <Label className="dark:text-gray-300">Vendor ID (optional)</Label>
              <Input
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                placeholder="Paste vendor ID from Vendors list"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          )}
          {type === 'FROM_CUSTOMER' && (
            <div>
              <Label className="dark:text-gray-300">Contact / Customer ID (optional)</Label>
              <Input
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                placeholder="Paste contact ID"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          )}
          <div>
            <Label className="dark:text-gray-300">Reference number (optional)</Label>
            <Input
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. CHQ-001"
              className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          <div>
            <Label className="dark:text-gray-300">Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Brief notes"
              className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !amount}
              className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              title={createMutation.isPending ? 'Please wait' : 'Create advance'}
            >
              {createMutation.isPending ? 'Creating…' : 'Create advance'}
            </Button>
            <Link href={`/finance/${tenantId}/Advances`}>
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
