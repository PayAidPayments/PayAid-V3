'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useContacts, useProducts, useTenant } from '@/lib/hooks/use-api'
import { useCreateInvoice } from '@/lib/hooks/use-api'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { INDIAN_STATES } from '@/lib/utils/indian-states'
import { determineGSTType } from '@/lib/invoicing/gst-state'
import { PageLoading } from '@/components/ui/loading'
import { formatINRStandard } from '@/lib/utils/formatINR'

// Invoice template options (matching settings page)
const invoiceTemplates = [
  { value: 'standard', label: 'Standard Invoice' },
  { value: 'minimal', label: 'Minimal Invoice' },
  { value: 'detailed', label: 'Detailed Invoice' },
  { value: 'professional', label: 'Professional Invoice' },
  { value: 'gst-compliant', label: 'GST Compliant Invoice' },
]

interface InvoiceItem {
  description: string
  quantity: number
  rate: number
  category: string
  hsnCode: string
  sacCode: string
  gstRate: number
  itemType: 'goods' | 'services' // Goods use HSN, Services use SAC
  selectedProductId?: string // Track which product is selected
}

export default function NewInvoicePage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillCustomerId = searchParams.get('customerId')
  const { data: contactsData, isLoading: contactsLoading, error: contactsError } = useContacts({ limit: 1000 })
  const { data: productsData } = useProducts({ limit: 1000 })
  const { data: tenantData } = useTenant()
  const createInvoice = useCreateInvoice()
  
  // Fetch invoice settings
  const { data: invoiceSettings } = useQuery({
    queryKey: ['invoice-settings'],
    queryFn: async () => {
      const { token } = useAuthStore.getState()
      const response = await fetch('/api/settings/invoices', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) return null
      return response.json()
    },
  })
  
  const products = productsData?.products || []

  const [formData, setFormData] = useState({
    customerId: prefillCustomerId || '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerCity: '',
    customerState: '',
    customerPostalCode: '',
    customerGSTIN: '',
    placeOfSupply: '', // For GST calculation (intra-state vs inter-state)
    supplierGSTIN: '', // Business GSTIN
    reverseCharge: false, // Reverse Charge Applicable (GST payable by recipient)
    orderNumber: '', // Order Number
    terms: '', // Payment Terms
    termsAndConditions: '', // Terms & Conditions
    accountsReceivable: '', // Accounts Receivable
    salespersonId: '', // Salesperson/Sales Rep
    discount: 0, // Discount amount
    discountType: 'amount' as 'amount' | 'percentage', // Discount type
    tdsType: '' as '' | 'tds' | 'tcs', // TDS or TCS
    tdsTax: '', // TDS/TCS tax selection
    adjustment: 0, // Adjustment amount
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
  })
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, rate: 0, category: 'standard', hsnCode: '', sacCode: '', gstRate: 18, itemType: 'goods', selectedProductId: '' },
  ])
  const [error, setError] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  
  // Fetch sales reps
  const { data: salesRepsData } = useQuery({
    queryKey: ['sales-reps'],
    queryFn: async () => {
      const { token } = useAuthStore.getState()
      const response = await fetch('/api/sales-reps', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) return { reps: [] }
      return response.json()
    },
  })
  
  const salesReps = salesRepsData?.reps || []

  const contacts = contactsData?.contacts || []

  // Debug logging
  useEffect(() => {
    if (contactsError) {
      console.error('Contacts loading error:', {
        message: contactsError.message,
        name: contactsError.name,
        stack: contactsError.stack,
        error: contactsError,
      })
    }
  }, [contactsError])

  useEffect(() => {
    if (contactsData) {
      console.log('Contacts loaded:', contacts.length, 'contacts', contactsData)
    }
  }, [contactsData, contacts.length])

  useEffect(() => {
    if (contactsLoading) {
      console.log('Contacts loading...')
    }
  }, [contactsLoading])

  // Debug tenant data
  useEffect(() => {
    if (tenantData) {
      console.log('Tenant data loaded:', {
        state: tenantData.state,
        gstin: tenantData.gstin,
        name: tenantData.name,
      })
    }
  }, [tenantData])

  // Auto-fill from tenant (business profile)
  useEffect(() => {
    if (tenantData) {
      setFormData(prev => {
        const updates: any = {}
        
        // Auto-fill supplier GSTIN if not already set
        if (tenantData.gstin && !prev.supplierGSTIN) {
          updates.supplierGSTIN = tenantData.gstin
        }
        
        // Auto-fill placeOfSupply if it's currently empty and tenant has a state
        // This allows user to change it later without it being overwritten
        if (!prev.placeOfSupply && tenantData.state) {
          updates.placeOfSupply = tenantData.state
        }
        
        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
          return {
            ...prev,
            ...updates,
          }
        }
        
        return prev
      })
    }
  }, [tenantData])

  // Apply default invoice settings
  useEffect(() => {
    if (invoiceSettings) {
      setFormData(prev => ({
        ...prev,
        reverseCharge: invoiceSettings.defaultReverseCharge || false,
        terms: invoiceSettings.defaultPaymentTerms || prev.terms,
        notes: invoiceSettings.defaultNotes || prev.notes,
      }))
    }
  }, [invoiceSettings])

  // Auto-fill customer details when prefillCustomerId changes (from URL)
  useEffect(() => {
    if (prefillCustomerId && contacts.length > 0) {
      const customer = contacts.find((c: any) => c.id === prefillCustomerId)
      if (customer) {
        setFormData(prev => ({
          ...prev,
          customerId: customer.id,
          customerName: customer.name || '',
          customerEmail: customer.email || '',
          customerPhone: customer.phone || '',
          customerAddress: customer.address || '',
          customerCity: customer.city || '',
          customerState: customer.state || '',
          customerPostalCode: customer.postalCode || '',
          customerGSTIN: customer.gstin || '',
          // Only set placeOfSupply from customer if customer has a state
          // Otherwise, keep current value or use tenant state
          placeOfSupply: customer.state 
            ? customer.state 
            : (prev.placeOfSupply || tenantData?.state || ''),
        }))
      }
    }
  }, [prefillCustomerId, contacts, tenantData])

  // Helper function to calculate due date from payment terms
  const calculateDueDate = (terms: string, invoiceDate: string): string => {
    if (!terms || !invoiceDate || terms === 'Custom') {
      return ''
    }

    const invoiceDateObj = new Date(invoiceDate)
    if (isNaN(invoiceDateObj.getTime())) {
      return ''
    }

    let daysToAdd = 0

    switch (terms) {
      case 'Due on Receipt':
        daysToAdd = 0
        break
      case 'Net 15':
        daysToAdd = 15
        break
      case 'Net 30':
        daysToAdd = 30
        break
      case 'Net 45':
        daysToAdd = 45
        break
      case 'Net 60':
        daysToAdd = 60
        break
      default:
        return ''
    }

    const dueDateObj = new Date(invoiceDateObj)
    dueDateObj.setDate(dueDateObj.getDate() + daysToAdd)
    
    return dueDateObj.toISOString().split('T')[0]
  }

  // Auto-populate due date based on payment terms and invoice date
  useEffect(() => {
    if (formData.terms && formData.invoiceDate && formData.terms !== 'Custom') {
      const calculatedDueDate = calculateDueDate(formData.terms, formData.invoiceDate)
      if (calculatedDueDate && calculatedDueDate !== formData.dueDate) {
        setFormData(prev => ({
          ...prev,
          dueDate: calculatedDueDate,
        }))
      }
    }
  }, [formData.terms, formData.invoiceDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.customerName) {
      setError('Customer name is required')
      return
    }

    if (items.length === 0 || items.some(item => !item.description || item.rate <= 0)) {
      setError('Please add at least one valid item')
      return
    }

    try {
      // Prepare invoice data
      const invoiceData: any = {
        customerId: formData.customerId || undefined,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail || undefined,
        customerPhone: formData.customerPhone || undefined,
        customerAddress: formData.customerAddress || undefined,
        customerCity: formData.customerCity || undefined,
        customerState: formData.customerState || undefined,
        customerPostalCode: formData.customerPostalCode || undefined,
        customerGSTIN: formData.customerGSTIN || undefined,
        supplierGSTIN: formData.supplierGSTIN || undefined,
        placeOfSupply: formData.placeOfSupply || undefined,
        reverseCharge: formData.reverseCharge,
        template: invoiceSettings?.template || 'standard',
        orderNumber: formData.orderNumber || undefined,
        terms: formData.terms || undefined,
        accountsReceivable: formData.accountsReceivable || undefined,
        salespersonId: formData.salespersonId || undefined,
        discount: formData.discount || 0,
        discountType: formData.discountType || 'amount',
        tdsType: formData.tdsType || undefined,
        tdsTax: formData.tdsTax || undefined,
        adjustment: formData.adjustment || 0,
        notes: formData.notes || undefined,
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          category: item.category,
          hsnCode: item.itemType === 'goods' ? (item.hsnCode || undefined) : undefined,
          sacCode: item.itemType === 'services' ? (item.sacCode || undefined) : undefined,
          gstRate: item.gstRate,
        })),
      }

      // Add dates if provided
      if (formData.invoiceDate) {
        invoiceData.invoiceDate = new Date(formData.invoiceDate).toISOString()
      }
      if (formData.dueDate) {
        invoiceData.dueDate = new Date(formData.dueDate).toISOString()
      }

      // Log the data being sent for debugging
      console.log('Creating invoice with data:', JSON.stringify(invoiceData, null, 2))

      const invoice = await createInvoice.mutateAsync(invoiceData)
      router.push(`/finance/${tenantId}/Invoices/${invoice.id}`)
    } catch (err: any) {
      console.error('Invoice creation error:', {
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
        error: err,
      })
      
      // Extract detailed error message
      let errorMessage = 'Failed to create invoice'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (err?.message) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      
      setError(errorMessage)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0, category: 'standard', hsnCode: '', sacCode: '', gstRate: 18, itemType: 'goods', selectedProductId: '' }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // Calculate totals with proper GST
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  
  // Calculate GST per item (for proper breakdown)
  const itemsWithGST = items.map(item => {
    const amount = item.quantity * item.rate
    const gstAmount = (amount * item.gstRate) / 100
    return { ...item, amount, gstAmount }
  })
  
  const totalGST = itemsWithGST.reduce((sum, item) => sum + item.gstAmount, 0)
  
  // Calculate discount
  const discountAmount = formData.discountType === 'percentage' 
    ? (subtotal * formData.discount) / 100 
    : formData.discount
  
  // Calculate subtotal after discount
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)
  
  // Calculate GST on discounted amount (if applicable)
  const gstOnDiscounted = (subtotalAfterDiscount * (itemsWithGST[0]?.gstRate || 18)) / 100
  
  // Calculate TDS/TCS percentage from selected tax
  let tdsPercentage = 0
  if (formData.tdsType && formData.tdsTax) {
    // Parse percentage from tdsTax value (e.g., "tds-2" -> 2, "tcs-1" -> 1)
    const match = formData.tdsTax.match(/(\d+)$/)
    if (match) {
      tdsPercentage = parseFloat(match[1])
    }
  }
  
  // Calculate TDS/TCS amount
  // Both TDS and TCS are calculated on the subtotal (amount excluding GST) in India
  // This is the standard practice for most services and goods
  const tdsBaseAmount = subtotalAfterDiscount
  const tdsAmount = tdsPercentage > 0 ? (tdsBaseAmount * tdsPercentage) / 100 : 0
  
  // IMPORTANT: TDS vs TCS difference:
  // - TDS (Tax Deducted at Source): Buyer deducts from payment → SUBTRACT from total
  // - TCS (Tax Collected at Source): Seller collects from buyer → ADD to total
  const isTDS = formData.tdsType === 'tds'
  const isTCS = formData.tdsType === 'tcs'
  
  // Final total with adjustment
  // Total = Subtotal + GST - TDS + TCS + Adjustment
  const total = subtotalAfterDiscount + totalGST - (isTDS ? tdsAmount : 0) + (isTCS ? tdsAmount : 0) + formData.adjustment
  
  // Auto-determine GST type based on seller and buyer states/GSTIN
  const sellerGSTIN = tenantData?.gstin || formData.supplierGSTIN
  const sellerState = tenantData?.state
  const buyerGSTIN = formData.customerGSTIN
  const buyerState = formData.customerState
  const placeOfSupply = formData.placeOfSupply || sellerState

  const gstTypeInfo = determineGSTType(
    sellerGSTIN,
    sellerState,
    buyerGSTIN,
    buyerState,
    placeOfSupply
  )

  const isInterState = gstTypeInfo.isInterState

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">New Invoice</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Create a GST-compliant invoice</p>
        </div>
        <Link href={`/finance/${tenantId}/Invoices`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Template Selection */}
            {invoiceSettings && (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-gray-100">Invoice Template</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Selected template: {invoiceTemplates.find(t => t.value === invoiceSettings.template)?.label || 'Standard'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    To change the default invoice template, go to{' '}
                    <Link href="/dashboard/settings/invoices" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Invoice Settings
                    </Link>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Customer Info */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="customerId" className="text-sm font-medium">
                    Select Contact (Optional)
                  </label>
                  {contactsLoading ? (
                    <div className="flex h-10 w-full items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      Loading contacts...
                    </div>
                  ) : contactsError ? (
                    <div className="space-y-2">
                      <div className="flex h-10 w-full items-center rounded-md border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                        Failed to load contacts. Please enter manually.
                      </div>
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Retry loading contacts
                      </button>
                    </div>
                  ) : (
                    <select
                      id="customerId"
                      name="customerId"
                      value={formData.customerId}
                      onChange={(e) => {
                        const contactId = e.target.value
                        const contact = contacts.find((c: any) => c.id === contactId)
                        if (contact) {
                          setFormData(prev => {
                            // Only update placeOfSupply from contact if contact has a state
                            // Otherwise, keep the current value (which might be from tenant profile)
                            const newPlaceOfSupply = contact.state 
                              ? contact.state 
                              : (prev.placeOfSupply || tenantData?.state || '')
                            
                            return {
                              ...prev,
                              customerId: contact.id,
                              customerName: contact.name || '',
                              customerEmail: contact.email || '',
                              customerPhone: contact.phone || '',
                              customerAddress: contact.address || '',
                              customerCity: contact.city || '',
                              customerState: contact.state || '',
                              customerPostalCode: contact.postalCode || '',
                              customerGSTIN: contact.gstin || '',
                              placeOfSupply: newPlaceOfSupply,
                            }
                          })
                        } else {
                          // Clear fields if "Or enter manually" is selected
                          setFormData(prev => ({
                            ...prev,
                            customerId: '',
                          }))
                        }
                      }}
                      className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                      disabled={createInvoice.isPending}
                    >
                      <option value="">Or enter manually</option>
                      {contacts.length === 0 ? (
                        <option value="" disabled>No contacts available</option>
                      ) : (
                        contacts.map((contact: any) => (
                          <option key={contact.id} value={contact.id}>
                            {contact.name} {contact.company ? `(${contact.company})` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="customerName" className="text-sm font-medium">
                      Customer Name *
                    </label>
                    <Input
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      required
                      disabled={createInvoice.isPending}
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="customerEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <Input
                      id="customerEmail"
                      name="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={handleChange}
                      disabled={createInvoice.isPending}
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="customerPhone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </label>
                    <Input
                      id="customerPhone"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleChange}
                      disabled={createInvoice.isPending}
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="customerGSTIN" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Customer GSTIN
                    </label>
                    <Input
                      id="customerGSTIN"
                      name="customerGSTIN"
                      value={formData.customerGSTIN}
                      onChange={handleChange}
                      placeholder="15-character GSTIN"
                      maxLength={15}
                      disabled={createInvoice.isPending}
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>
                </div>

                {/* Supplier GSTIN and Place of Supply */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="supplierGSTIN" className="text-sm font-medium">
                        Your Business GSTIN *
                      </label>
                      {tenantData?.gstin && (
                        <span className="text-xs text-blue-600">Auto-filled from profile</span>
                      )}
                    </div>
                    <Input
                      id="supplierGSTIN"
                      name="supplierGSTIN"
                      value={formData.supplierGSTIN}
                      onChange={handleChange}
                      placeholder="15-character GSTIN"
                      maxLength={15}
                      required
                      disabled={createInvoice.isPending}
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="placeOfSupply" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Place of Supply *
                      </label>
                      {tenantData?.state && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">Auto-filled from profile</span>
                      )}
                    </div>
                    <select
                      id="placeOfSupply"
                      name="placeOfSupply"
                      value={formData.placeOfSupply}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                      required
                      disabled={createInvoice.isPending}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state.code} value={state.name}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Reverse Charge Applicable - Only show if enabled in settings */}
                  {invoiceSettings?.showReverseCharge !== false && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="reverseCharge"
                          name="reverseCharge"
                          checked={formData.reverseCharge}
                          onChange={(e) => setFormData(prev => ({ ...prev, reverseCharge: e.target.checked }))}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={createInvoice.isPending}
                        />
                        <label htmlFor="reverseCharge" className="text-sm font-medium cursor-pointer">
                          Reverse Charge Applicable (GST payable by recipient)
                        </label>
                      </div>
                      {formData.reverseCharge && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
                          ⚠️ Reverse Charge: GST will be payable by the recipient instead of the supplier.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="customerAddress" className="text-sm font-medium">
                    Address
                  </label>
                  <Input
                    id="customerAddress"
                    name="customerAddress"
                    value={formData.customerAddress}
                    onChange={handleChange}
                    disabled={createInvoice.isPending}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="customerCity" className="text-sm font-medium">
                      City
                    </label>
                    <Input
                      id="customerCity"
                      name="customerCity"
                      value={formData.customerCity}
                      onChange={handleChange}
                      disabled={createInvoice.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="customerState" className="text-sm font-medium">
                      State
                    </label>
                    <Input
                      id="customerState"
                      name="customerState"
                      value={formData.customerState}
                      onChange={handleChange}
                      disabled={createInvoice.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="customerPostalCode" className="text-sm font-medium">
                      Postal Code
                    </label>
                    <Input
                      id="customerPostalCode"
                      name="customerPostalCode"
                      value={formData.customerPostalCode}
                      onChange={handleChange}
                      disabled={createInvoice.isPending}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="orderNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Order Number
                    </label>
                    <Input
                      id="orderNumber"
                      name="orderNumber"
                      value={formData.orderNumber}
                      onChange={handleChange}
                      placeholder="Enter order number"
                      disabled={createInvoice.isPending}
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="terms" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Payment Terms
                    </label>
                    <select
                      id="terms"
                      name="terms"
                      value={formData.terms}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                      disabled={createInvoice.isPending}
                    >
                      <option value="">Select Terms</option>
                      <option value="Due on Receipt">Due on Receipt</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                      <option value="Due on Receipt">Due on Receipt</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="accountsReceivable" className="text-sm font-medium">
                      Accounts Receivable
                    </label>
                    <select
                      id="accountsReceivable"
                      name="accountsReceivable"
                      value={formData.accountsReceivable}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                      disabled={createInvoice.isPending}
                    >
                      <option value="">Select Account</option>
                      <option value="Accounts Receivable">Accounts Receivable</option>
                      <option value="Trade Receivables">Trade Receivables</option>
                      <option value="Other Receivables">Other Receivables</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="salespersonId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Salesperson
                    </label>
                    <select
                      id="salespersonId"
                      name="salespersonId"
                      value={formData.salespersonId}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                      disabled={createInvoice.isPending}
                    >
                      <option value="">Select or Add Salesperson</option>
                      {salesReps.map((rep: any) => (
                        <option key={rep.id} value={rep.id}>
                          {rep.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Invoice Items</CardTitle>
                <CardDescription className="dark:text-gray-400">Add products or services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-700 space-y-3">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-6 space-y-2">
                        <label className="text-xs text-gray-500">Select Product (Optional)</label>
                        <select
                          value={item.selectedProductId || ''}
                          onChange={(e) => {
                            const productId = e.target.value
                            const product = products.find((p: any) => p.id === productId)
                            
                            if (product) {
                              const isService = product.itemType === 'services' || product.categories?.includes('Services') || product.quantity === 0
                              const newItems = [...items]
                              newItems[index] = {
                                ...newItems[index],
                                selectedProductId: productId,
                                description: product.name,
                                rate: product.salePrice || 0,
                                itemType: product.itemType || (isService ? 'services' : 'goods'),
                                hsnCode: product.hsnCode || '',
                                sacCode: product.sacCode || '',
                                gstRate: product.gstRate || 18,
                              }
                              setItems(newItems)
                            } else {
                              // Clear selection
                              const newItems = [...items]
                              newItems[index] = {
                                ...newItems[index],
                                selectedProductId: '',
                              }
                              setItems(newItems)
                            }
                          }}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm mb-2"
                          disabled={createInvoice.isPending}
                        >
                          <option value="">Select a product...</option>
                          {products.map((product: any) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - {product.salePrice ? formatINRStandard(product.salePrice) : '₹0'}
                            </option>
                          ))}
                        </select>
                        <Input
                          placeholder="Or enter description manually *"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          required
                          disabled={createInvoice.isPending}
                          className="dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <select
                          value={item.itemType}
                          onChange={(e) => handleItemChange(index, 'itemType', e.target.value as 'goods' | 'services')}
                          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                          disabled={createInvoice.isPending}
                        >
                          <option value="goods">Goods</option>
                          <option value="services">Services</option>
                        </select>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Input
                          type="number"
                          placeholder="Qty *"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          required
                          disabled={createInvoice.isPending}
                          className="dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="Rate (₹) *"
                          value={item.rate === 0 ? '' : item.rate.toFixed(2)}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '')
                            // Prevent multiple decimal points
                            const parts = value.split('.')
                            const formattedValue = parts.length > 2 
                              ? parts[0] + '.' + parts.slice(1).join('')
                              : value
                            // Limit to 2 decimal places
                            const limitedValue = parts.length === 2 && parts[1].length > 2
                              ? parts[0] + '.' + parts[1].substring(0, 2)
                              : formattedValue
                            const numValue = limitedValue === '' ? 0 : parseFloat(limitedValue) || 0
                            handleItemChange(index, 'rate', numValue)
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value) || 0
                            handleItemChange(index, 'rate', parseFloat(value.toFixed(2)))
                          }}
                          required
                          disabled={createInvoice.isPending}
                          className="dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-12 gap-3">
                      {item.itemType === 'goods' ? (
                        <div className="col-span-3 space-y-2">
                          <label className="text-xs text-gray-500">HSN Code</label>
                          <Input
                            placeholder="HSN Code"
                            value={item.hsnCode}
                            onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                            disabled={createInvoice.isPending}
                            className="dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500"
                          />
                        </div>
                      ) : (
                        <div className="col-span-3 space-y-2">
                          <label className="text-xs text-gray-500 dark:text-gray-400">SAC Code</label>
                          <Input
                            placeholder="SAC Code"
                            value={item.sacCode}
                            onChange={(e) => handleItemChange(index, 'sacCode', e.target.value)}
                            disabled={createInvoice.isPending}
                            className="dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500"
                          />
                        </div>
                      )}
                      
                      <div className="col-span-3 space-y-2">
                        <label className="text-xs text-gray-500 dark:text-gray-400">GST Rate (%)</label>
                        <select
                          value={item.gstRate}
                          onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value))}
                          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                          disabled={createInvoice.isPending}
                        >
                          <option value={0}>0% (Nil)</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18% (Standard)</option>
                          <option value={28}>28% (Luxury)</option>
                        </select>
                      </div>
                      
                      <div className="col-span-3 space-y-2">
                        <label className="text-xs text-gray-500 dark:text-gray-400">Category</label>
                        <select
                          value={item.category}
                          onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                          disabled={createInvoice.isPending}
                        >
                          <option value="essential">Essential (0%)</option>
                          <option value="fast-moving">Fast Moving (5%)</option>
                          <option value="standard">Standard (18%)</option>
                          <option value="luxury">Luxury (28%)</option>
                        </select>
                      </div>
                      
                      <div className="col-span-3 flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={createInvoice.isPending || items.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-right text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Amount: </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{formatINRStandard(item.quantity * item.rate)}</span>
                      {item.gstRate > 0 && (
                        <>
                          <span className="text-gray-600 dark:text-gray-400 ml-2">+ GST ({item.gstRate}%): </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{formatINRStandard((item.quantity * item.rate * item.gstRate) / 100)}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addItem}
                  disabled={createInvoice.isPending}
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  + Add Item
                </Button>
              </CardContent>
            </Card>

            {/* Dates & Notes */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="invoiceDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Invoice Date
                    </label>
                    <Input
                      id="invoiceDate"
                      name="invoiceDate"
                      type="date"
                      value={formData.invoiceDate}
                      onChange={handleChange}
                      disabled={createInvoice.isPending}
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="dueDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Due Date
                    </label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={handleChange}
                      disabled={createInvoice.isPending}
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Customer Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="flex w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                    placeholder="Thank you for the Business"
                    disabled={createInvoice.isPending}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Will be displayed on the invoice</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="termsAndConditions" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Terms & Conditions
                  </label>
                  <textarea
                    id="termsAndConditions"
                    name="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={handleChange}
                    rows={3}
                    className="flex w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                    placeholder="Enter terms and conditions"
                    disabled={createInvoice.isPending}
                  />
                </div>

                {/* File Attachments */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Attach File(s) to Invoice
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setAttachments(Array.from(e.target.files))
                      }
                    }}
                    className="flex w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                    disabled={createInvoice.isPending}
                  />
                  {attachments.length > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {attachments.length} file(s) selected
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatINRStandard(subtotal)}</span>
                </div>
                
                {/* Discount */}
                <div className="space-y-2 border-t dark:border-gray-700 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Discount</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.discount === 0 ? '' : formData.discount.toFixed(2)}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '')
                          // Prevent multiple decimal points
                          const parts = value.split('.')
                          const formattedValue = parts.length > 2 
                            ? parts[0] + '.' + parts.slice(1).join('')
                            : value
                          // Limit to 2 decimal places
                          const limitedValue = parts.length === 2 && parts[1].length > 2
                            ? parts[0] + '.' + parts[1].substring(0, 2)
                            : formattedValue
                          const numValue = limitedValue === '' ? 0 : parseFloat(limitedValue) || 0
                          setFormData(prev => ({ ...prev, discount: numValue }))
                        }}
                        onBlur={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setFormData(prev => ({ ...prev, discount: parseFloat(value.toFixed(2)) }))
                        }}
                        className="w-20 h-8 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 text-sm"
                        placeholder="0.00"
                        disabled={createInvoice.isPending}
                      />
                      <select
                        value={formData.discountType}
                        onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value as 'amount' | 'percentage' }))}
                        className="h-8 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 text-sm"
                        disabled={createInvoice.isPending}
                      >
                        <option value="amount">₹</option>
                        <option value="percentage">%</option>
                      </select>
                    </div>
                  </div>
                  {formData.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                      <span>Discount Amount</span>
                      <span>-{formatINRStandard(discountAmount)}</span>
                    </div>
                  )}
                </div>
                
                {/* TDS / TCS */}
                <div className="space-y-2 border-t dark:border-gray-700 pt-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">TDS / TCS</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tdsType"
                        value="tds"
                        checked={formData.tdsType === 'tds'}
                        onChange={(e) => setFormData(prev => ({ ...prev, tdsType: e.target.checked ? 'tds' : '' }))}
                        className="h-4 w-4"
                        disabled={createInvoice.isPending}
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-100">TDS</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tdsType"
                        value="tcs"
                        checked={formData.tdsType === 'tcs'}
                        onChange={(e) => setFormData(prev => ({ ...prev, tdsType: e.target.checked ? 'tcs' : '' }))}
                        className="h-4 w-4"
                        disabled={createInvoice.isPending}
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-100">TCS</span>
                    </label>
                  </div>
                  {formData.tdsType && (
                    <select
                      value={formData.tdsTax}
                      onChange={(e) => setFormData(prev => ({ ...prev, tdsTax: e.target.value }))}
                      className="w-full h-8 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 text-sm"
                      disabled={createInvoice.isPending}
                    >
                      <option value="">Select a Tax</option>
                      <option value="tds-1">TDS 1%</option>
                      <option value="tds-2">TDS 2%</option>
                      <option value="tds-5">TDS 5%</option>
                      <option value="tds-10">TDS 10%</option>
                      <option value="tcs-1">TCS 1%</option>
                      <option value="tcs-2">TCS 2%</option>
                    </select>
                  )}
                </div>
                
                {/* Adjustment */}
                <div className="space-y-2 border-t dark:border-gray-700 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Adjustment</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.adjustment === 0 ? '' : formData.adjustment.toFixed(2)}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.-]/g, '')
                          // Allow negative values for adjustments
                          const isNegative = value.startsWith('-')
                          const cleanValue = value.replace(/-/g, '')
                          // Prevent multiple decimal points
                          const parts = cleanValue.split('.')
                          const formattedValue = parts.length > 2 
                            ? parts[0] + '.' + parts.slice(1).join('')
                            : cleanValue
                          // Limit to 2 decimal places
                          const limitedValue = parts.length === 2 && parts[1].length > 2
                            ? parts[0] + '.' + parts[1].substring(0, 2)
                            : formattedValue
                          const finalValue = isNegative && limitedValue ? '-' + limitedValue : limitedValue
                          const numValue = finalValue === '' || finalValue === '-' ? 0 : parseFloat(finalValue) || 0
                          setFormData(prev => ({ ...prev, adjustment: numValue }))
                        }}
                        onBlur={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setFormData(prev => ({ ...prev, adjustment: parseFloat(value.toFixed(2)) }))
                        }}
                        className="w-24 h-8 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 text-sm"
                        placeholder="0.00"
                        disabled={createInvoice.isPending}
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">?</span>
                    </div>
                  </div>
                </div>
                
                {/* GST Breakdown */}
                {isInterState ? (
                  <div className="space-y-1 border-t dark:border-gray-700 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">IGST ({itemsWithGST[0]?.gstRate || 18}%)</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{formatINRStandard(totalGST)}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Inter-state supply
                      {gstTypeInfo.sellerStateCode && gstTypeInfo.buyerStateCode && (
                        <span className="ml-2">
                          ({gstTypeInfo.sellerStateCode} → {gstTypeInfo.buyerStateCode})
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 border-t dark:border-gray-700 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">CGST ({(itemsWithGST[0]?.gstRate || 18) / 2}%)</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{formatINRStandard(totalGST / 2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">SGST ({(itemsWithGST[0]?.gstRate || 18) / 2}%)</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{formatINRStandard(totalGST / 2)}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Intra-state supply
                      {gstTypeInfo.sellerStateCode && (
                        <span className="ml-2">(State: {gstTypeInfo.sellerStateCode})</span>
                      )}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-gray-600 dark:text-gray-400">Total GST</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatINRStandard(totalGST)}</span>
                </div>
                
                {/* Discount */}
                {formData.discount > 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">
                      Discount {formData.discountType === 'percentage' ? `(${formData.discount}%)` : ''}
                    </span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -{formatINRStandard(discountAmount)}
                    </span>
                  </div>
                )}
                
                {/* TDS/TCS */}
                {formData.tdsType && formData.tdsTax && tdsAmount > 0 && (
                  <div className="pt-2 border-t dark:border-gray-700">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        {formData.tdsType.toUpperCase()} ({tdsPercentage}%)
                      </span>
                      <span className={`font-medium ${
                        formData.tdsType === 'tds' 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {formData.tdsType === 'tds' ? '-' : '+'}{formatINRStandard(tdsAmount)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.tdsType === 'tds' 
                        ? 'Deducted from payment (buyer deposits with government)'
                        : 'Collected from buyer (seller deposits with government)'
                      }
                    </p>
                  </div>
                )}
                
                {/* Adjustment */}
                {formData.adjustment !== 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Adjustment</span>
                    <span className={`font-medium ${formData.adjustment >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formData.adjustment >= 0 ? '+' : ''}{formatINRStandard(formData.adjustment)}
                    </span>
                  </div>
                )}
                
                {formData.reverseCharge && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900 p-2 rounded-md">
                      <span>⚠️</span>
                      <span>Reverse Charge Applicable (GST payable by recipient)</span>
                    </div>
                  </div>
                )}
                
                <div className="border-t dark:border-gray-700 pt-3 flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-gray-100">Total Amount</span>
                  <span className="text-blue-600 dark:text-blue-400">{formatINRStandard(total)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
                <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  handleSubmit(e as any)
                }}
                disabled={createInvoice.isPending} 
                variant="outline"
                className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {createInvoice.isPending ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button 
                type="submit" 
                disabled={createInvoice.isPending} 
                className="w-full dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                {createInvoice.isPending ? 'Sending...' : 'Save and Send'}
              </Button>
              <Link href={`/finance/${tenantId}/Invoices`}>
                <Button type="button" variant="outline" className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" disabled={createInvoice.isPending}>
                  Cancel
                </Button>
              </Link>
              <div className="pt-2 border-t dark:border-gray-700">
                <Link href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Make Recurring
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Bottom Save Button - Sticky Footer (inside main content area, not covering sidebar) */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50 -mx-6 -mb-6 mt-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Make Recurring
            </Link>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Amount: {formatINRStandard(total)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Quantity: {items.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </div>
          <div className="flex gap-4">
            <Link href={`/finance/${tenantId}/Invoices`}>
              <Button type="button" variant="outline" disabled={createInvoice.isPending} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Cancel
              </Button>
            </Link>
            <Button 
              type="button" 
              onClick={(e) => {
                e.preventDefault()
                const form = document.querySelector('form') as HTMLFormElement
                if (form) {
                  // Save as draft
                  const draftButton = document.createElement('button')
                  draftButton.type = 'button'
                  draftButton.style.display = 'none'
                  form.appendChild(draftButton)
                  // We'll handle draft separately
                }
              }}
              disabled={createInvoice.isPending}
              variant="outline"
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Save as Draft
            </Button>
            <Button 
              type="button" 
              onClick={(e) => {
                e.preventDefault()
                const form = document.querySelector('form') as HTMLFormElement
                if (form) {
                  form.requestSubmit()
                }
              }}
              disabled={createInvoice.isPending}
              className="min-w-[150px] dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              {createInvoice.isPending ? 'Sending...' : 'Save and Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
