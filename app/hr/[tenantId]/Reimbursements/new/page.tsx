'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect, CustomSelectTrigger, CustomSelectContent, CustomSelectItem } from '@/components/ui/custom-select'
import { Receipt, Save, Upload } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

export default function HRReimbursementNewPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()

  const [formData, setFormData] = useState({
    expenseDate: '',
    category: '',
    amount: '',
    description: '',
    vendor: '',
    paymentMethod: 'CASH',
    attachments: [] as File[],
  })

  const createReimbursement = useMutation({
    mutationFn: async (data: any) => {
      const formDataToSend = new FormData()
      Object.keys(data).forEach((key) => {
        if (key !== 'attachments') {
          formDataToSend.append(key, data[key])
        }
      })
      data.attachments.forEach((file: File, index: number) => {
        formDataToSend.append(`attachment_${index}`, file)
      })

      const res = await fetch('/api/hr/reimbursements', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to submit reimbursement')
      }
      return res.json()
    },
    onSuccess: () => {
      router.push(`/hr/${tenantId}/Reimbursements`)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, attachments: Array.from(e.target.files) })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createReimbursement.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
    })
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Submit Reimbursement"
        moduleIcon={<Receipt className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Submit expense reimbursement request"
      />

      <div className="p-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Reimbursement Details</CardTitle>
            <CardDescription>Fill in the expense details and upload receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Expense Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Expense Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expenseDate">Expense Date *</Label>
                    <Input
                      id="expenseDate"
                      type="date"
                      value={formData.expenseDate}
                      onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <CustomSelect
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      placeholder="Select category"
                    >
                      <CustomSelectTrigger />
                      <CustomSelectContent>
                        <CustomSelectItem value="TRAVEL">Travel</CustomSelectItem>
                        <CustomSelectItem value="MEALS">Meals</CustomSelectItem>
                        <CustomSelectItem value="ACCOMMODATION">Accommodation</CustomSelectItem>
                        <CustomSelectItem value="TRANSPORT">Transport</CustomSelectItem>
                        <CustomSelectItem value="OFFICE_SUPPLIES">Office Supplies</CustomSelectItem>
                        <CustomSelectItem value="TELECOM">Telecom</CustomSelectItem>
                        <CustomSelectItem value="OTHER">Other</CustomSelectItem>
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (₹) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      placeholder="5000"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <CustomSelect
                      value={formData.paymentMethod}
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                      placeholder="Select method"
                    >
                      <CustomSelectTrigger />
                      <CustomSelectContent>
                        <CustomSelectItem value="CASH">Cash</CustomSelectItem>
                        <CustomSelectItem value="CARD">Card</CustomSelectItem>
                        <CustomSelectItem value="UPI">UPI</CustomSelectItem>
                        <CustomSelectItem value="BANK_TRANSFER">Bank Transfer</CustomSelectItem>
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="vendor">Vendor/Merchant</Label>
                    <Input
                      id="vendor"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      placeholder="e.g., Uber, Restaurant Name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="description">Description *</Label>
                    <textarea
                      id="description"
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      placeholder="Describe the expense..."
                    />
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Receipts & Documents</h3>
                <div>
                  <Label htmlFor="attachments">Upload Receipts</Label>
                  <div className="mt-2">
                    <Input
                      id="attachments"
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    {formData.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {formData.attachments.map((file, index) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            • {file.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload receipts or invoices (PDF, JPG, PNG)
                  </p>
                </div>
              </div>

              {/* Summary */}
              {formData.amount && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Amount</span>
                      <span className="font-bold text-xl">{formatINRForDisplay(parseFloat(formData.amount) || 0)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createReimbursement.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createReimbursement.isPending ? 'Submitting...' : 'Submit Reimbursement'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
