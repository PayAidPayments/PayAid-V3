'use client'

import { useState } from 'react'
import { Calendar, FileText, Settings, Play, Pause, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RecurringInvoice {
  id: string
  name: string
  customer: string
  amount: number
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  nextRun: Date
  status: 'active' | 'paused'
  template: string
}

interface InvoiceAutomationProps {
  tenantId: string
}

export function InvoiceAutomation({ tenantId }: InvoiceAutomationProps) {
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([
    {
      id: '1',
      name: 'Monthly Subscription - ABC Corp',
      customer: 'ABC Corp',
      amount: 50000,
      frequency: 'monthly',
      nextRun: new Date('2026-02-01'),
      status: 'active',
      template: 'Subscription Template',
    },
    {
      id: '2',
      name: 'Weekly Service - XYZ Ltd',
      customer: 'XYZ Ltd',
      amount: 15000,
      frequency: 'weekly',
      nextRun: new Date('2026-01-20'),
      status: 'active',
      template: 'Service Template',
    },
  ])
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const toggleStatus = (id: string) => {
    setRecurringInvoices(prev => prev.map(ri => 
      ri.id === id 
        ? { ...ri, status: ri.status === 'active' ? 'paused' : 'active' }
        : ri
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invoice Automation</h2>
          <p className="text-gray-500">Automate recurring invoices and templates</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Recurring Invoice
        </Button>
      </div>

      {/* Recurring Invoices */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recurring Invoices</CardTitle>
          <CardDescription>Automatically generated invoices on schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recurringInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <div className="font-medium">{invoice.name}</div>
                      <div className="text-sm text-gray-500">
                        {invoice.customer} • Template: {invoice.template}
                      </div>
                    </div>
                    <Badge variant={invoice.status === 'active' ? 'default' : 'secondary'}>
                      {invoice.status}
                    </Badge>
                    <Badge variant="outline">
                      {invoice.frequency}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Amount: ₹{invoice.amount.toLocaleString()}</span>
                    <span>Next run: {invoice.nextRun.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(invoice.id)}
                  >
                    {invoice.status === 'active' ? (
                      <>
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
            {recurringInvoices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No recurring invoices configured</p>
              </div>
            )}
          </div>
        </CardContent>
      </GlassCard>

      {/* Create Recurring Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Recurring Invoice</DialogTitle>
            <DialogDescription>
              Set up an invoice that will be automatically generated on a schedule
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Invoice Name</Label>
              <Input placeholder="e.g., Monthly Subscription" />
            </div>
            <div>
              <Label>Customer</Label>
              <Input placeholder="Select customer" />
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" placeholder="0.00" />
            </div>
            <div>
              <Label>Frequency</Label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <Label>Template</Label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select template</option>
                <option value="subscription">Subscription Template</option>
                <option value="service">Service Template</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateDialog(false)}>
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
