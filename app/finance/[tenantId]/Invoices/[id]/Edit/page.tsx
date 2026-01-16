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
  const { data: contactsData } = useContacts()
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
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</Button>
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

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Invoice items and GST details cannot be edited here. 
                Please create a new invoice if you need to modify items.
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <Link href={`/finance/${tenantId}/Invoices/${id}`}>
                <Button type="button" variant="outline" disabled={updateInvoice.isPending} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={updateInvoice.isPending} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                {updateInvoice.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bottom Save Button - Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50">
        <div className="max-w-7xl mx-auto flex justify-end gap-4">
          <Link href={`/finance/${tenantId}/Invoices/${id}`}>
            <Button type="button" variant="outline" disabled={updateInvoice.isPending} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
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
            className="min-w-[150px] dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            {updateInvoice.isPending ? 'Saving...' : 'Save Invoice'}
          </Button>
        </div>
      </div>
      <div className="h-20"></div>
    </div>
  )
}
