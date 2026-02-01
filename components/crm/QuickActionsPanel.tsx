'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  UserPlus, 
  Handshake, 
  Calendar, 
  CheckSquare, 
  Mail, 
  Phone,
  FileText,
  X,
  Zap
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  shortcut?: string
  action: () => void
}

interface QuickActionsPanelProps {
  tenantId: string
}

export function QuickActionsPanel({ tenantId }: QuickActionsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showDialog, setShowDialog] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuthStore()

  const quickActions: QuickAction[] = [
    {
      id: 'contact',
      label: 'New Contact',
      icon: <UserPlus className="w-5 h-5" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      shortcut: 'Ctrl+N',
      action: () => router.push(`/crm/${tenantId}/contacts-new`),
    },
    {
      id: 'deal',
      label: 'New Deal',
      icon: <Handshake className="w-5 h-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      shortcut: 'Ctrl+D',
      action: () => router.push(`/crm/${tenantId}/Deals/New`),
    },
    {
      id: 'meeting',
      label: 'Schedule Meeting',
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      shortcut: 'Ctrl+M',
      action: () => setShowDialog('meeting'),
    },
    {
      id: 'task',
      label: 'Create Task',
      icon: <CheckSquare className="w-5 h-5" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      shortcut: 'Ctrl+T',
      action: () => setShowDialog('task'),
    },
    {
      id: 'email',
      label: 'Send Email',
      icon: <Mail className="w-5 h-5" />,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      shortcut: 'Ctrl+E',
      action: () => setShowDialog('email'),
    },
    {
      id: 'call',
      label: 'Log Call',
      icon: <Phone className="w-5 h-5" />,
      color: 'bg-teal-500 hover:bg-teal-600',
      shortcut: 'Ctrl+L',
      action: () => setShowDialog('call'),
    },
    {
      id: 'quote',
      label: 'Create Quote',
      icon: <FileText className="w-5 h-5" />,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      shortcut: 'Ctrl+Q',
      action: () => router.push(`/crm/${tenantId}/Quotes`),
    },
  ]

  // Keyboard shortcuts
  useState(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd + key combinations
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault()
            router.push(`/crm/${tenantId}/contacts-new`)
            break
          case 'd':
            e.preventDefault()
            router.push(`/crm/${tenantId}/Deals/New`)
            break
          case 'm':
            e.preventDefault()
            setShowDialog('meeting')
            break
          case 't':
            e.preventDefault()
            setShowDialog('task')
            break
          case 'e':
            e.preventDefault()
            setShowDialog('email')
            break
          case 'l':
            e.preventDefault()
            setShowDialog('call')
            break
          case 'q':
            e.preventDefault()
            router.push(`/crm/${tenantId}/Quotes`)
            break
          case 'k':
            e.preventDefault()
            // Trigger global search (to be implemented)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <AnimatePresence>
          {isOpen ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 min-w-[280px]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Quick Actions
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <motion.button
                    key={action.id}
                    onClick={() => {
                      action.action()
                      setIsOpen(false)
                    }}
                    className={`w-full ${action.color} text-white rounded-lg p-3 flex items-center justify-between transition-all hover:shadow-lg`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      {action.icon}
                      <span className="font-medium">{action.label}</span>
                    </div>
                    {action.shortcut && (
                      <kbd className="px-2 py-1 text-xs bg-white/20 rounded">
                        {action.shortcut}
                      </kbd>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.button
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Zap className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick Action Dialogs */}
      <Dialog open={showDialog === 'meeting'} onOpenChange={() => setShowDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>
              Create a new meeting and invite participants
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Meeting scheduling form will be implemented here. Redirecting to Meetings page...
            </p>
            <Button
              onClick={() => {
                router.push(`/crm/${tenantId}/Meetings`)
                setShowDialog(null)
              }}
              className="mt-4"
            >
              Go to Meetings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDialog === 'task'} onOpenChange={() => setShowDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Create a new task and assign it to yourself or team members
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Task creation form will be implemented here. Redirecting to Tasks page...
            </p>
            <Button
              onClick={() => {
                router.push(`/crm/${tenantId}/Tasks`)
                setShowDialog(null)
              }}
              className="mt-4"
            >
              Go to Tasks
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDialog === 'email'} onOpenChange={() => setShowDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Compose and send an email to contacts
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Email composer will be implemented here. This will integrate with the email module.
            </p>
            <Button
              onClick={() => {
                // Open email composer or redirect
                setShowDialog(null)
              }}
              className="mt-4"
            >
              Open Email Composer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDialog === 'call'} onOpenChange={() => setShowDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Call</DialogTitle>
            <DialogDescription>
              Log a call activity with a contact
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Call logging form will be implemented here. Redirecting to Dialer...
            </p>
            <Button
              onClick={() => {
                router.push(`/crm/${tenantId}/Dialer`)
                setShowDialog(null)
              }}
              className="mt-4"
            >
              Go to Dialer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
