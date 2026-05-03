'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/ui/loading'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { ArrowLeft, Save, X } from 'lucide-react'
import { useContacts } from '@/lib/hooks/use-api'
import { INDIAN_STATES } from '@/lib/utils/indian-states'
import { determineGSTType } from '@/lib/invoicing/gst-state'

interface CreditNoteItem {
  description: string
  quantity: number
  rate: number
  hsnCode: string
  gstRate: number
  amount: number
  taxAmount: number
}

const REASON_OPTIONS = [
  { value: 'return', label: 'Return' },
  { value: 'discount', label: 'Discount' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'other', label: 'Other' },
]

export default function NewCreditNotePage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const router = useRouter()
  const { token } = useAuthStore()
  const { data: contactsData } = useContacts({ limit: 1000 })
  const contacts = contactsData?.contacts || []

  const [formData, setFormData] = useState({
    invoiceId: '',
    invoiceNumber: '',
    reason: 'return',
    reasonDescription: '',
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerCity: '',
    customerState: '',
    customerPostalCode: '',
    customerGSTIN: '',
    creditNoteDate: new Date().toISOString().split('T')[0],
    notes: '',
    termsAndConditions: '',
  })

  const [items, setItems] = useState<CreditNoteItem[]>([
    { description: '', quantity: 1, rate: 0, hsnCode: '', gstRate: 18, amount: 0, taxAmount: 0 },
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-fill customer data when selected
  useEffect(() => {
    if (formData.customerId) {
      const customer = contacts.find((c: any) => c.id === formData.customerId)
      if (customer) {
        setFormData((prev) => ({
          ...prev,
          customerName: customer.name || '',
          customerEmail: customer.email || '',
          customerPhone: customer.phone || '',
          customerAddress: customer.address || '',
          customerCity: customer.city || '',
          customerState: customer.state || '',
          customerPostalCode: customer.postalCode || '',
          customerGSTIN: customer.gstin || '',
        }))
      }
    }
  }, [formData.customerId, contacts])

  // Calculate item totals
  useEffect(() => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        const amount = item.quantity * item.rate
        const taxAmount = (amount * item.gstRate) / 100
        return { ...item, amount, taxAmount }
      })
    )
  }, [items.map((i) => `${i.quantity}-${i.rate}-${i.gstRate}`).join(',')])

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const tax = items.reduce((sum, item) => sum + item.taxAmount, 0)
  const total = subtotal + tax

  // Determine GST type
  const isInterState = formData.customerState && formData.customerState !== 'Maharashtra' // Assuming tenant is in Maharashtra
  const gstType = determineGSTType(isInterState, formData.customerState || '')
  const cgst = !isInterState ? tax / 2 : 0
  const sgst = !isInterState ? tax / 2 : 0
  const igst = isInterState ? tax : 0
  const gstRate = items.length > 0 ? items[0].gstRate : 18

  const createCreditNote = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/finance/credit-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          tenantId,
          invoiceId: formData.invoiceId || null,
          invoiceNumber: formData.invoiceNumber || null,
          reason: formData.reason,
          reasonDescription: formData.reasonDescription,
          subtotal,
          tax,
          total,
          gstRate,
          gstAmount: tax,
          cgst,
          sgst,
          igst,
          isInterState,
          placeOfSupply: formData.customerState || null,
          hsnCode: items[0]?.hsnCode || null,
          items: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            hsnCode: item.hsnCode,
            gstRate: item.gstRate,
            amount: item.amount,
            taxAmount: item.taxAmount,
          })),
          customerId: formData.customerId || null,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          customerAddress: formData.customerAddress,
          customerCity: formData.customerCity,
          customerState: formData.customerState,
          customerPostalCode: formData.customerPostalCode,
          customerGSTIN: formData.customerGSTIN,
          notes: formData.notes,
          termsAndConditions: formData.termsAndConditions,
          creditNoteDate: formData.creditNoteDate,
          currency: 'INR',
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to create credit note')
      }

      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/finance/${tenantId}/Credit-Notes/${data.creditNote.id}`)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.customerName && !formData.customerId) {
      alert('Please select or enter customer information')
      return
    }
    setIsSubmitting(true)
    try {
      await createCreditNote.mutateAsync()
    } catch (error) {
      console.error('Error creating credit note:', error)
      alert((error as Error).message || 'Failed to create credit note')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0, hsnCode: '', gstRate: 18, amount: 0, taxAmount: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof CreditNoteItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/finance/${tenantId}/Credit-Notes`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Credit Note</h1>
            <p className="text-sm text-muted-foreground mt-1">Create a credit note for returns, discounts, or adjustments</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Customer</label>
                    <select
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3"
                    >
                      <option value="">Select Customer</option>
                      {contacts.map((contact: any) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.name} {contact.email ? `(${contact.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Customer Name *</label>
                    <Input
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email</label>
                      <Input
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Phone</label>
                      <Input
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Address</label>
                    <Input
                      value={formData.customerAddress}
                      onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">City</label>
                      <Input
                        value={formData.customerCity}
                        onChange={(e) => setFormData({ ...formData, customerCity: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">State</label>
                      <select
                        value={formData.customerState}
                        onChange={(e) => setFormData({ ...formData, customerState: e.target.value })}
                        className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Postal Code</label>
                      <Input
                        value={formData.customerPostalCode}
                        onChange={(e) => setFormData({ ...formData, customerPostalCode: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">GSTIN</label>
                    <Input
                      value={formData.customerGSTIN}
                      onChange={(e) => setFormData({ ...formData, customerGSTIN: e.target.value })}
                      placeholder="29ABCDE1234F1Z5"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Credit Note Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Reason *</label>
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3"
                      required
                    >
                      {REASON_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Reason Description</label>
                    <textarea
                      value={formData.reasonDescription}
                      onChange={(e) => setFormData({ ...formData, reasonDescription: e.target.value })}
                      className="w-full min-h-[80px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                      placeholder="Describe the reason for this credit note..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Credit Note Date *</label>
                    <Input
                      type="date"
                      value={formData.creditNoteDate}
                      onChange={(e) => setFormData({ ...formData, creditNoteDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Related Invoice Number (Optional)</label>
                    <Input
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      placeholder="INV-2025-001"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full min-h-[80px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Items</CardTitle>
                  <CardDescription>Add items for this credit note</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Item {index + 1}</span>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">Description *</label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Quantity</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Rate (₹)</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">GST Rate (%)</label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.gstRate}
                            onChange={(e) => updateItem(index, 'gstRate', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">HSN Code</label>
                        <Input
                          value={item.hsnCode}
                          onChange={(e) => updateItem(index, 'hsnCode', e.target.value)}
                          placeholder="e.g., 8517"
                        />
                      </div>

                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span>Amount: {formatINRForDisplay(item.amount)}</span>
                        <span>Tax: {formatINRForDisplay(item.taxAmount)}</span>
                        <span className="font-semibold">Total: {formatINRForDisplay(item.amount + item.taxAmount)}</span>
                      </div>
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={addItem} className="w-full">
                    + Add Item
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatINRForDisplay(subtotal)}</span>
                  </div>
                  {cgst > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>CGST:</span>
                        <span>{formatINRForDisplay(cgst)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>SGST:</span>
                        <span>{formatINRForDisplay(sgst)}</span>
                      </div>
                    </>
                  )}
                  {igst > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>IGST:</span>
                      <span>{formatINRForDisplay(igst)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-lg font-bold">{formatINRForDisplay(total)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link href={`/finance/${tenantId}/Credit-Notes`}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Creating...' : 'Create Credit Note'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
