'use client'

import { useState } from 'react'
import { Plus, FileText, ShoppingCart, IndianRupee, Bell, Landmark, RefreshCw, CreditCard, Calendar, ArrowLeftRight, ArrowRightLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

interface QuickActionsPanelProps {
  tenantId: string
}

const actions = [
  {
    id: 'create-invoice',
    label: 'Create Invoice',
    icon: <FileText className="w-5 h-5" />,
    shortcut: 'Ctrl+I',
    href: (tenantId: string) => `/finance/${tenantId}/Invoices/new`,
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    id: 'create-po',
    label: 'Create Purchase Order',
    icon: <ShoppingCart className="w-5 h-5" />,
    shortcut: 'Ctrl+P',
    href: (tenantId: string) => `/finance/${tenantId}/Purchase-Orders/new`,
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    id: 'record-expense',
    label: 'Record Expense',
    icon: <IndianRupee className="w-5 h-5" />,
    shortcut: 'Ctrl+E',
    href: (tenantId: string) => `/finance/${tenantId}/Accounting/Expenses/New`,
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    id: 'payment-reminder',
    label: 'Send Payment Reminder',
    icon: <Bell className="w-5 h-5" />,
    shortcut: 'Ctrl+R',
    dialog: 'payment-reminder',
    color: 'bg-yellow-500 hover:bg-yellow-600',
  },
  {
    id: 'gst-report',
    label: 'Generate GST Report',
    icon: <Landmark className="w-5 h-5" />,
    shortcut: 'Ctrl+G',
    href: (tenantId: string) => `/finance/${tenantId}/GST`,
    color: 'bg-orange-500 hover:bg-orange-600',
  },
  {
    id: 'bank-reconciliation',
    label: 'Bank Reconciliation',
    icon: <RefreshCw className="w-5 h-5" />,
    shortcut: 'Ctrl+B',
    href: (tenantId: string) => `/finance/${tenantId}/Accounting/Bank-Reconciliation`,
    color: 'bg-teal-500 hover:bg-teal-600',
  },
  {
    id: 'recurring-invoice',
    label: 'Create Recurring Invoice',
    icon: <Calendar className="w-5 h-5" />,
    shortcut: 'Ctrl+U',
    href: (tenantId: string) => `/finance/${tenantId}/Recurring-Billing`,
    color: 'bg-indigo-500 hover:bg-indigo-600',
  },
  {
    id: 'record-payment',
    label: 'Record Payment',
    icon: <CreditCard className="w-5 h-5" />,
    shortcut: 'Ctrl+M',
    dialog: 'record-payment',
    color: 'bg-pink-500 hover:bg-pink-600',
  },
  {
    id: 'create-credit-note',
    label: 'Create Credit Note',
    icon: <ArrowLeftRight className="w-5 h-5" />,
    shortcut: 'Ctrl+C',
    href: (tenantId: string) => `/finance/${tenantId}/Credit-Notes/new`,
    color: 'bg-emerald-500 hover:bg-emerald-600',
  },
  {
    id: 'create-debit-note',
    label: 'Create Debit Note',
    icon: <ArrowRightLeft className="w-5 h-5" />,
    shortcut: 'Ctrl+D',
    href: (tenantId: string) => `/finance/${tenantId}/Debit-Notes/new`,
    color: 'bg-amber-500 hover:bg-amber-600',
  },
]

export function QuickActionsPanel({ tenantId }: QuickActionsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const router = useRouter()

  // Keyboard shortcuts
  useState(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const action = actions.find(a => 
          a.shortcut.toLowerCase() === `ctrl+${e.key.toLowerCase()}`
        )
        if (action) {
          e.preventDefault()
          if (action.href) {
            router.push(action.href(tenantId))
          } else if (action.dialog) {
            setIsOpen(true)
            setActiveDialog(action.dialog)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const handleActionClick = (action: typeof actions[0]) => {
    if (action.href) {
      router.push(action.href(tenantId))
    } else if (action.dialog) {
      setIsOpen(true)
      setActiveDialog(action.dialog)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mb-4 space-y-2"
            >
              {actions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    onClick={() => handleActionClick(action)}
                    className={`${action.color} text-white shadow-lg w-full justify-start gap-3`}
                  >
                    {action.icon}
                    <div className="flex-1 text-left">
                      <div className="font-medium">{action.label}</div>
                      <div className="text-xs opacity-90">{action.shortcut}</div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg bg-purple-600 hover:bg-purple-700"
        >
          <Plus className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
        </Button>
      </motion.div>

      {/* Dialogs */}
      <Dialog open={activeDialog === 'payment-reminder'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
            <DialogDescription>
              Send payment reminders to customers with overdue invoices
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Payment reminder functionality will be implemented here.
              This will allow you to select invoices and send automated reminders.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'record-payment'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment received from a customer
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Payment recording form will be implemented here.
              This will allow you to record payments against invoices.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
