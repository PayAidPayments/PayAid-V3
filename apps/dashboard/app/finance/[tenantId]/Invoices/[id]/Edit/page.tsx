'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useInvoice, useUpdateInvoice, useContacts } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/ui/loading'

export default function EditInvoicePage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const router = useRouter()
  const { data: invoice, isLoading } = useInvoice(id)
  const { data: contactsData } = useContacts({ tenantId })
  const updateInvoice = useUpdateInvoice()
  const contacts = contactsData?.contacts || []
  
  const [formData, setFormData] = useState({
    customerId: '',
    invoiceDate: '',
    dueDate: '',
    notes: '',
    terms: '',
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
  })
  type ItemRow = { description: string; quantity: number; rate: number; gstRate?: number }
  const [items, setItems] = useState<ItemRow[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (invoice) {
      setFormData({
        customerId: invoice.customerId || '',
        invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : '',
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
        notes: invoice.notes || '',
        terms: invoice.terms || '',
        status: invoice.status || 'draft',
      })
      const raw = invoice.items
      if (Array.isArray(raw) && raw.length > 0) {
        setItems(
          raw.map((row: any) => ({
            description: row.description || '',
            quantity: Number(row.quantity) || 1,
            rate: Number(row.rate) || 0,
            gstRate: row.gstRate != null ? Number(row.gstRate) : 18,
          }))
        )
      } else {
        setItems([{ description: 'Item', quantity: 1, rate: invoice.subtotal ?? 0, gstRate: 18 }])
      }
    }
  }, [invoice])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await updateInvoice.mutateAsync({
        id,
        data: {
          ...formData,
          invoiceDate: formData.invoiceDate ? new Date(formData.invoiceDate).toISOString() : undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
          items: items.map((row) => ({
            description: row.description,
            quantity: row.quantity,
            rate: row.rate,
            gstRate: row.gstRate ?? 18,
          })),
        },
      })
      router.push(`/finance/${tenantId}/Invoices/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update invoice')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleItemChange = (index: number, field: keyof ItemRow, value: string | number) => {
    setItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  if (isLoading) {
    return <PageLoading message="Loading invoice..." fullScreen={false} />
  }

  if (!invoice) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Invoice not found</p>
        <Link href={`/finance/${tenantId}/Invoices`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Back to Invoices</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Invoice</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Update invoice information</p>
        </div>
        <Link href={`/finance/${tenantId}/Invoices/${id}`}>
          <Button
            variant="outline"
            disabled={updateInvoice.isPending}
            title={updateInvoice.isPending ? 'Please wait' : 'Cancel and return'}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
        </Link>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Invoice Information</CardTitle>
          <CardDescription className="dark:text-gray-400">Update the invoice details below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="customerId" className="text-sm font-medium text-gray-700 dark:text-gray-300">Customer *</label>
                <select
                  id="customerId"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                  required
                  disabled={updateInvoice.isPending}
                >
                  <option value="">Select Customer</option>
                  {contacts
                    .filter((c: any) => c.type === 'customer')
                    .map((contact: any) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                  required
                  disabled={updateInvoice.isPending}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="invoiceDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Date *</label>
                <Input
                  id="invoiceDate"
                  name="invoiceDate"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={handleChange}
                  required
                  disabled={updateInvoice.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="dueDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                  disabled={updateInvoice.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="flex w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                  disabled={updateInvoice.isPending}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="terms" className="text-sm font-medium text-gray-700 dark:text-gray-300">Terms & Conditions</label>
                <textarea
                  id="terms"
                  name="terms"
                  value={formData.terms}
                  onChange={handleChange}
                  rows={4}
                  className="flex w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                  disabled={updateInvoice.isPending}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Line items (quantity, rate, description)</label>
              <div className="border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left p-2 dark:text-gray-200">Description</th>
                      <th className="text-right p-2 w-24 dark:text-gray-200">Qty</th>
                      <th className="text-right p-2 w-28 dark:text-gray-200">Rate (₹)</th>
                      <th className="text-right p-2 w-28 dark:text-gray-200">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row, idx) => (
                      <tr key={idx} className="border-t border-gray-200 dark:border-gray-600">
                        <td className="p-2">
                          <Input
                            value={row.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            disabled={updateInvoice.isPending}
                            className="h-9 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0.01}
                            step={1}
                            value={row.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            disabled={updateInvoice.isPending}
                            className="h-9 text-right dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={row.rate}
                            onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                            disabled={updateInvoice.isPending}
                            className="h-9 text-right dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          />
                        </td>
                        <td className="p-2 text-right dark:text-gray-100">
                          ₹{(row.quantity * row.rate).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href={`/finance/${tenantId}/Invoices/${id}`}>
                <Button
                  type="button"
                  variant="outline"
                  disabled={updateInvoice.isPending}
                  title={updateInvoice.isPending ? 'Please wait' : 'Cancel and return'}
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={updateInvoice.isPending}
                title={updateInvoice.isPending ? 'Please wait' : 'Save invoice changes'}
                className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                {updateInvoice.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bottom Save Button - Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50">
        <div className="max-w-7xl mx-auto flex justify-end gap-4">
          <Link href={`/finance/${tenantId}/Invoices/${id}`}>
            <Button
              type="button"
              variant="outline"
              disabled={updateInvoice.isPending}
              title={updateInvoice.isPending ? 'Please wait' : 'Cancel and return'}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
          </Link>
          <Button 
            type="button" 
            onClick={(e) => {
              e.preventDefault()
              const form = document.querySelector('form') as HTMLFormElement
              if (form) {
                form.requestSubmit()
              }
            }}
            disabled={updateInvoice.isPending}
            title={updateInvoice.isPending ? 'Please wait' : 'Save invoice'}
            className="min-w-[150px] dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            {updateInvoice.isPending ? 'Saving…' : 'Save Invoice'}
          </Button>
        </div>
      </div>
      <div className="h-20"></div>
    </div>
  )
}
