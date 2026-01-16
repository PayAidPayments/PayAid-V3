'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useInvoice } from '@/lib/hooks/use-api'
import { useAuthStore } from '@/lib/stores/auth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'

// Number to words converter for Indian currency
function numberToWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  
  function convertHundreds(num: number): string {
    let result = ''
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred '
      num %= 100
    }
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' '
      num %= 10
    }
    if (num > 0) {
      result += ones[num] + ' '
    }
    return result.trim()
  }
  
  if (amount === 0) return 'Zero'
  
  let rupees = Math.floor(amount)
  const paise = Math.round((amount - rupees) * 100)
  
  let result = ''
  
  if (rupees >= 10000000) {
    result += convertHundreds(Math.floor(rupees / 10000000)) + 'Crore '
    rupees %= 10000000
  }
  if (rupees >= 100000) {
    result += convertHundreds(Math.floor(rupees / 100000)) + 'Lakh '
    rupees %= 100000
  }
  if (rupees >= 1000) {
    result += convertHundreds(Math.floor(rupees / 1000)) + 'Thousand '
    rupees %= 1000
  }
  if (rupees > 0) {
    result += convertHundreds(rupees)
  }
  
  result = result.trim() + ' Rupees'
  
  if (paise > 0) {
    result += ' and ' + convertHundreds(paise) + ' Paise'
  }
  
  return result + ' Only'
}

export default function FinanceInvoiceDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const queryClient = useQueryClient()
  const { data: invoice, isLoading } = useInvoice(id)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState('')

  const sendInvoiceMutation = useMutation({
    mutationFn: async () => {
      const { token } = useAuthStore.getState()
      const response = await fetch(`/api/invoices/${id}/send-with-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          email: invoice?.customer?.email,
        }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || error.message || 'Failed to send invoice')
      }
      return response.json()
    },
    onSuccess: (data) => {
      setSendSuccess(data.message || 'Invoice sent successfully with payment link!')
      setSendError('')
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      setTimeout(() => setSendSuccess(''), 5000)
    },
    onError: (err: Error) => {
      setSendError(err.message)
      setSendSuccess('')
    },
  })

  const downloadPDF = async () => {
    try {
      const { token } = useAuthStore.getState()
      const response = await fetch(`/api/invoices/${id}/pdf`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to download PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoice?.invoiceNumber || 'invoice'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      alert(error.message || 'Failed to download PDF')
    }
  }

  if (isLoading) {
    return <PageLoading message="Loading invoice..." fullScreen={false} />
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Invoice not found</p>
        <Link href={`/finance/${tenantId}/Invoices`}>
          <Button>Back to Invoices</Button>
        </Link>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Invoice {invoice.invoiceNumber}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {invoice.customer?.name || 'N/A'}
          </p>
        </div>
        <div className="flex gap-2">
          {invoice.customer?.email && invoice.status !== 'paid' && (
            <Button
              onClick={() => sendInvoiceMutation.mutate()}
              disabled={sendInvoiceMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {sendInvoiceMutation.isPending ? 'Sending...' : '📧 Send with Payment Link'}
            </Button>
          )}
          <Button variant="outline" onClick={downloadPDF}>
            Download PDF
          </Button>
          <Link href={`/finance/${tenantId}/Invoices/${id}/Edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Link href={`/finance/${tenantId}/Invoices`}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Invoice Date</div>
                  <div className="font-medium dark:text-gray-100">
                    {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'MMMM dd, yyyy') : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Due Date</div>
                  <div className="font-medium dark:text-gray-100">
                    {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMMM dd, yyyy') : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">GST Rate</div>
                  <div className="font-medium dark:text-gray-100">{invoice.gstRate || 18}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">HSN Code</div>
                  <div className="font-medium dark:text-gray-100">{invoice.hsnCode || '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indian GST Format Invoice Display */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-center dark:text-gray-100">TAX INVOICE</CardTitle>
              <CardDescription className="text-center dark:text-gray-400">Original for Recipient</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Supplier and Customer Details */}
              <div className="grid grid-cols-2 gap-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                  <h3 className="font-semibold text-sm mb-2 dark:text-gray-100">FROM (Supplier)</h3>
                  <div className="text-sm space-y-1">
                    <div className="font-medium dark:text-gray-100">{invoice.tenant?.name || 'Business Name'}</div>
                    {invoice.tenant?.address && (
                      <div className="text-gray-600 dark:text-gray-400">{invoice.tenant.address}</div>
                    )}
                    {(invoice.tenant?.city || invoice.tenant?.state) && (
                      <div className="text-gray-600 dark:text-gray-400">
                        {[invoice.tenant.city, invoice.tenant.state, invoice.tenant.postalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    )}
                    {(invoice.supplierGSTIN || invoice.tenant?.gstin) && (
                      <div className="text-gray-600 dark:text-gray-400">
                        GSTIN: {invoice.supplierGSTIN || invoice.tenant?.gstin || '-'}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-2 dark:text-gray-100">TO (Recipient)</h3>
                  <div className="text-sm space-y-1">
                    <div className="font-medium dark:text-gray-100">
                      {invoice.customerName || invoice.customer?.name || 'N/A'}
                    </div>
                    {invoice.customerAddress && (
                      <div className="text-gray-600 dark:text-gray-400">{invoice.customerAddress}</div>
                    )}
                    {(invoice.customerCity || invoice.customerState || invoice.customerPostalCode) && (
                      <div className="text-gray-600 dark:text-gray-400">
                        {[invoice.customerCity, invoice.customerState, invoice.customerPostalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    )}
                    {invoice.customerGSTIN && (
                      <div className="text-gray-600 dark:text-gray-400">GSTIN: {invoice.customerGSTIN}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-3 gap-4 text-sm border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Invoice No.</div>
                  <div className="font-medium dark:text-gray-100">{invoice.invoiceNumber}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Invoice Date</div>
                  <div className="font-medium dark:text-gray-100">
                    {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'dd/MM/yyyy') : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Due Date</div>
                  <div className="font-medium dark:text-gray-100">
                    {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd/MM/yyyy') : '-'}
                  </div>
                </div>
                {invoice.orderNumber && (
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Order Number</div>
                    <div className="font-medium dark:text-gray-100">{invoice.orderNumber}</div>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Payment Terms</div>
                    <div className="font-medium dark:text-gray-100">{invoice.terms}</div>
                  </div>
                )}
                {invoice.reverseCharge && (
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Reverse Charge</div>
                    <div className="font-medium text-amber-600 dark:text-amber-400">Applicable</div>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700 dark:text-gray-100">Description</th>
                      <th className="text-center p-3 border-b border-gray-200 dark:border-gray-700 dark:text-gray-100">HSN/SAC</th>
                      <th className="text-center p-3 border-b border-gray-200 dark:border-gray-700 dark:text-gray-100">Qty</th>
                      <th className="text-right p-3 border-b border-gray-200 dark:border-gray-700 dark:text-gray-100">Rate</th>
                      <th className="text-right p-3 border-b border-gray-200 dark:border-gray-700 dark:text-gray-100">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border-b border-gray-200 dark:border-gray-700 dark:text-gray-100">Goods/Services</td>
                      <td className="p-3 border-b border-gray-200 dark:border-gray-700 text-center dark:text-gray-100">{invoice.hsnCode || '-'}</td>
                      <td className="p-3 border-b border-gray-200 dark:border-gray-700 text-center dark:text-gray-100">1</td>
                      <td className="p-3 border-b border-gray-200 dark:border-gray-700 text-right dark:text-gray-100">₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 border-b border-gray-200 dark:border-gray-700 text-right font-medium dark:text-gray-100">₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Amount Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium dark:text-gray-100">₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                
                {/* Discount */}
                {invoice.discount && invoice.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                    <span>
                      Discount {invoice.discountType === 'percentage' ? `(${invoice.discount}%)` : ''}
                    </span>
                    <span>
                      -₹{(() => {
                        const discountAmount = invoice.discountType === 'percentage' 
                          ? (invoice.subtotal * invoice.discount) / 100 
                          : invoice.discount
                        return discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                      })()}
                    </span>
                  </div>
                )}
                
                {/* Subtotal after discount */}
                {invoice.discount && invoice.discount > 0 && (
                  <div className="flex justify-between text-sm pt-1 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal after Discount</span>
                    <span className="font-medium dark:text-gray-100">
                      ₹{(() => {
                        const discountAmount = invoice.discountType === 'percentage' 
                          ? (invoice.subtotal * invoice.discount) / 100 
                          : invoice.discount
                        const subtotalAfterDiscount = Math.max(0, invoice.subtotal - discountAmount)
                        return subtotalAfterDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                      })()}
                    </span>
                  </div>
                )}
                
                {/* GST Breakdown */}
                {(() => {
                  const gstAmount = invoice.gstAmount || invoice.tax || 0
                  const gstRate = invoice.gstRate || 18
                  const isInterState = invoice.isInterState ?? false
                  
                  const cgst = invoice.cgst ?? (isInterState ? 0 : gstAmount / 2)
                  const sgst = invoice.sgst ?? (isInterState ? 0 : gstAmount / 2)
                  const igst = invoice.igst ?? (isInterState ? gstAmount : 0)
                  
                  if (isInterState) {
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">IGST ({gstRate}%)</span>
                          <span className="font-medium dark:text-gray-100">₹{igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Inter-state supply
                          {invoice.placeOfSupply && (
                            <span className="ml-2">(Place of Supply: {invoice.placeOfSupply})</span>
                          )}
                        </p>
                      </div>
                    )
                  } else {
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">CGST ({gstRate / 2}%)</span>
                          <span className="font-medium dark:text-gray-100">₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">SGST ({gstRate / 2}%)</span>
                          <span className="font-medium dark:text-gray-100">₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Intra-state supply</p>
                      </div>
                    )
                  }
                })()}
                
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Total GST</span>
                  <span className="font-medium dark:text-gray-100">₹{(invoice.gstAmount || invoice.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                
                {/* TDS/TCS */}
                {invoice.tdsType && invoice.tdsTax && invoice.tdsAmount && invoice.tdsAmount > 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">
                      {invoice.tdsType.toUpperCase()} {(() => {
                        const match = invoice.tdsTax.match(/(\d+)$/)
                        return match ? `(${match[1]}%)` : ''
                      })()}
                    </span>
                    <span className={`font-medium ${invoice.tdsType === 'tds' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {invoice.tdsType === 'tds' ? '-' : '+'}₹{invoice.tdsAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                
                {/* Adjustment */}
                {invoice.adjustment && invoice.adjustment !== 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Adjustment</span>
                    <span className={`font-medium ${invoice.adjustment >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {invoice.adjustment >= 0 ? '+' : ''}₹{invoice.adjustment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="dark:text-gray-100">Total Amount</span>
                  <span className="text-blue-600 dark:text-blue-400">₹{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Amount in Words */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
                <div className="text-gray-600 dark:text-gray-400">Amount in Words:</div>
                <div className="font-medium italic dark:text-gray-100">
                  {numberToWords(invoice.total)}
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
                  <div className="text-gray-600 dark:text-gray-400 font-medium mb-1">Notes:</div>
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{invoice.notes}</div>
                </div>
              )}

              {/* Terms & Conditions */}
              {invoice.termsAndConditions && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
                  <div className="text-gray-600 dark:text-gray-400 font-medium mb-1">Terms & Conditions:</div>
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{invoice.termsAndConditions}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <span className={`px-3 py-1 text-sm rounded-full capitalize ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {invoice.paidAt ? (
                <>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Paid On</div>
                    <div className="font-medium dark:text-gray-100">
                      {format(new Date(invoice.paidAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="text-green-600 dark:text-green-400 font-semibold">✓ Paid</div>
                </>
              ) : (
                <div className="text-orange-600 dark:text-orange-400 font-semibold">Pending Payment</div>
              )}
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sendError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  {sendError}
                </div>
              )}
              {sendSuccess && (
                <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  {sendSuccess}
                </div>
              )}
              {invoice.customer?.email && invoice.status !== 'paid' && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => sendInvoiceMutation.mutate()}
                  disabled={sendInvoiceMutation.isPending}
                >
                  {sendInvoiceMutation.isPending ? 'Sending...' : '📧 Send Invoice with Payment Link'}
                </Button>
              )}
              {invoice.paymentLinkUrl && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Payment Link:</div>
                  <a
                    href={invoice.paymentLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {invoice.paymentLinkUrl}
                  </a>
                </div>
              )}
              {invoice.status === 'draft' && (
                <Button
                  className="w-full"
                  onClick={async () => {
                    if (confirm('Mark invoice as sent?')) {
                      try {
                        await fetch(`/api/invoices/${id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${useAuthStore.getState().token}`,
                          },
                          body: JSON.stringify({ status: 'sent' }),
                        })
                        queryClient.invalidateQueries({ queryKey: ['invoice', id] })
                      } catch (error) {
                        alert('Failed to update invoice')
                      }
                    }
                  }}
                >
                  Mark as Sent
                </Button>
              )}
              {invoice.status === 'sent' && !invoice.paidAt && (
                <Button
                  className="w-full"
                  onClick={async () => {
                    if (confirm('Mark invoice as paid?')) {
                      try {
                        await fetch(`/api/invoices/${id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${useAuthStore.getState().token}`,
                          },
                          body: JSON.stringify({ status: 'paid', paidAt: new Date().toISOString() }),
                        })
                        queryClient.invalidateQueries({ queryKey: ['invoice', id] })
                      } catch (error) {
                        alert('Failed to update invoice')
                      }
                    }
                  }}
                >
                  Mark as Paid
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
