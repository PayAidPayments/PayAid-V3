'use client'

import { useState } from 'react'
import { Bell, Mail, MessageSquare, Calendar, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface PaymentReminder {
  id: string
  invoiceNumber: string
  customerName: string
  amount: number
  dueDate: Date
  daysOverdue: number
  reminderSent: boolean
  lastReminderDate?: Date
}

interface PaymentRemindersProps {
  tenantId: string
}

export function PaymentReminders({ tenantId }: PaymentRemindersProps) {
  const [reminders, setReminders] = useState<PaymentReminder[]>([
    {
      id: '1',
      invoiceNumber: 'INV-001',
      customerName: 'ABC Corp',
      amount: 50000,
      dueDate: new Date('2025-12-15'),
      daysOverdue: 20,
      reminderSent: true,
      lastReminderDate: new Date('2026-01-01'),
    },
    {
      id: '2',
      invoiceNumber: 'INV-002',
      customerName: 'XYZ Ltd',
      amount: 75000,
      dueDate: new Date('2025-12-20'),
      daysOverdue: 15,
      reminderSent: false,
    },
  ])
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [reminderSchedule, setReminderSchedule] = useState({
    daysBefore: 7,
    daysAfter: 3,
    frequency: 'weekly',
    channels: ['email'] as string[],
  })

  const handleSendReminder = async (reminderId: string) => {
    // API call to send reminder
    setReminders(prev => prev.map(r => 
      r.id === reminderId 
        ? { ...r, reminderSent: true, lastReminderDate: new Date() }
        : r
    ))
  }

  const handleSendBulkReminders = async () => {
    // API call to send bulk reminders
    const overdueReminders = reminders.filter(r => !r.reminderSent)
    setReminders(prev => prev.map(r => 
      overdueReminders.some(or => or.id === r.id)
        ? { ...r, reminderSent: true, lastReminderDate: new Date() }
        : r
    ))
  }

  const handleGeneratePaymentLink = async (reminderId: string) => {
    // API call to generate PayAid Link
    const reminder = reminders.find(r => r.id === reminderId)
    if (reminder) {
      // Show payment link dialog
      alert(`Payment link generated: https://payaid.link/pay/${reminder.invoiceNumber}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Reminders</h2>
          <p className="text-gray-500">Automate payment reminders for overdue invoices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScheduleDialog(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Settings
          </Button>
          <Button onClick={handleSendBulkReminders}>
            <Bell className="w-4 h-4 mr-2" />
            Send All Reminders
          </Button>
        </div>
      </div>

      {/* Reminder Schedule Settings */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Automated Reminder Schedule</CardTitle>
          <CardDescription>
            Reminders sent {reminderSchedule.daysBefore} days before due date and {reminderSchedule.daysAfter} days after
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              Email
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              SMS
            </Badge>
            <Badge variant="outline">
              Frequency: {reminderSchedule.frequency}
            </Badge>
          </div>
        </CardContent>
      </GlassCard>

      {/* Overdue Invoices */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Overdue Invoices</CardTitle>
          <CardDescription>Invoices requiring payment reminders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <div className="font-medium">{reminder.invoiceNumber}</div>
                      <div className="text-sm text-gray-500">{reminder.customerName}</div>
                    </div>
                    <Badge variant={reminder.daysOverdue > 30 ? 'destructive' : 'warning'}>
                      {reminder.daysOverdue} days overdue
                    </Badge>
                    {reminder.reminderSent && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Reminder sent
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Amount: <strong className="text-gray-900 dark:text-gray-100">{formatINRForDisplay(reminder.amount)}</strong></span>
                    <span>Due: {reminder.dueDate.toLocaleDateString()}</span>
                    {reminder.lastReminderDate && (
                      <span>Last reminder: {reminder.lastReminderDate.toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGeneratePaymentLink(reminder.id)}
                  >
                    Generate Link
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleSendReminder(reminder.id)}
                    disabled={reminder.reminderSent}
                  >
                    <Bell className="w-4 h-4 mr-1" />
                    Send Reminder
                  </Button>
                </div>
              </div>
            ))}
            {reminders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No overdue invoices requiring reminders</p>
              </div>
            )}
          </div>
        </CardContent>
      </GlassCard>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reminder Schedule Settings</DialogTitle>
            <DialogDescription>
              Configure automated payment reminder schedule
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Days Before Due Date</Label>
              <Input
                type="number"
                value={reminderSchedule.daysBefore}
                onChange={(e) => setReminderSchedule({ ...reminderSchedule, daysBefore: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Days After Due Date</Label>
              <Input
                type="number"
                value={reminderSchedule.daysAfter}
                onChange={(e) => setReminderSchedule({ ...reminderSchedule, daysAfter: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Reminder Frequency</Label>
              <select
                value={reminderSchedule.frequency}
                onChange={(e) => setReminderSchedule({ ...reminderSchedule, frequency: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <Label>Channels</Label>
              <div className="space-y-2 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={reminderSchedule.channels.includes('email')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setReminderSchedule({
                          ...reminderSchedule,
                          channels: [...reminderSchedule.channels, 'email'],
                        })
                      } else {
                        setReminderSchedule({
                          ...reminderSchedule,
                          channels: reminderSchedule.channels.filter(c => c !== 'email'),
                        })
                      }
                    }}
                  />
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={reminderSchedule.channels.includes('sms')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setReminderSchedule({
                          ...reminderSchedule,
                          channels: [...reminderSchedule.channels, 'sms'],
                        })
                      } else {
                        setReminderSchedule({
                          ...reminderSchedule,
                          channels: reminderSchedule.channels.filter(c => c !== 'sms'),
                        })
                      }
                    }}
                  />
                  <MessageSquare className="w-4 h-4" />
                  SMS
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Save schedule
              setShowScheduleDialog(false)
            }}>
              Save Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
