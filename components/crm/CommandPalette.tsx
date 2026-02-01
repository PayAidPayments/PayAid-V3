'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  UserPlus, 
  Handshake, 
  Calendar, 
  CheckSquare, 
  Mail, 
  Phone,
  FileText,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  HelpCircle,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/lib/stores/auth'

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  category: string
  action: () => void
  shortcut?: string
}

interface CommandPaletteProps {
  tenantId: string
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ tenantId, isOpen, onClose }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const { user } = useAuthStore()
  const inputRef = useRef<HTMLInputElement>(null)

  const commands: Command[] = [
    // Navigation
    {
      id: 'contacts',
      label: 'Go to Contacts',
      description: 'View all contacts',
      icon: <Users className="w-4 h-4" />,
      category: 'Navigation',
      action: () => router.push(`/crm/${tenantId}/AllPeople`),
    },
    {
      id: 'deals',
      label: 'Go to Deals',
      description: 'View all deals',
      icon: <Briefcase className="w-4 h-4" />,
      category: 'Navigation',
      action: () => router.push(`/crm/${tenantId}/Deals`),
    },
    {
      id: 'tasks',
      label: 'Go to Tasks',
      description: 'View all tasks',
      icon: <CheckSquare className="w-4 h-4" />,
      category: 'Navigation',
      action: () => router.push(`/crm/${tenantId}/Tasks`),
    },
    {
      id: 'analytics',
      label: 'Go to Analytics',
      description: 'View CRM analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      category: 'Navigation',
      action: () => router.push(`/crm/${tenantId}/Home/?view=sales`),
    },
    {
      id: 'settings',
      label: 'Go to Settings',
      description: 'CRM settings and configuration',
      icon: <Settings className="w-4 h-4" />,
      category: 'Navigation',
      action: () => router.push(`/crm/${tenantId}/Settings`),
    },
    // Actions
    {
      id: 'new-contact',
      label: 'New Contact',
      description: 'Create a new contact',
      icon: <UserPlus className="w-4 h-4" />,
      category: 'Actions',
      shortcut: 'Ctrl+N',
      action: () => router.push(`/crm/${tenantId}/contacts-new`),
    },
    {
      id: 'new-deal',
      label: 'New Deal',
      description: 'Create a new deal',
      icon: <Handshake className="w-4 h-4" />,
      category: 'Actions',
      shortcut: 'Ctrl+D',
      action: () => router.push(`/crm/${tenantId}/Deals/New`),
    },
    {
      id: 'new-meeting',
      label: 'Schedule Meeting',
      description: 'Schedule a new meeting',
      icon: <Calendar className="w-4 h-4" />,
      category: 'Actions',
      shortcut: 'Ctrl+M',
      action: () => router.push(`/crm/${tenantId}/Meetings`),
    },
    {
      id: 'new-task',
      label: 'Create Task',
      description: 'Create a new task',
      icon: <CheckSquare className="w-4 h-4" />,
      category: 'Actions',
      shortcut: 'Ctrl+T',
      action: () => router.push(`/crm/${tenantId}/Tasks`),
    },
    {
      id: 'send-email',
      label: 'Send Email',
      description: 'Compose and send email',
      icon: <Mail className="w-4 h-4" />,
      category: 'Actions',
      shortcut: 'Ctrl+E',
      action: () => {
        // Open email composer
        onClose()
      },
    },
    {
      id: 'log-call',
      label: 'Log Call',
      description: 'Log a call activity',
      icon: <Phone className="w-4 h-4" />,
      category: 'Actions',
      shortcut: 'Ctrl+L',
      action: () => router.push(`/crm/${tenantId}/Dialer`),
    },
    {
      id: 'create-quote',
      label: 'Create Quote',
      description: 'Create a new quote',
      icon: <FileText className="w-4 h-4" />,
      category: 'Actions',
      shortcut: 'Ctrl+Q',
      action: () => router.push(`/crm/${tenantId}/Quotes`),
    },
    // Help
    {
      id: 'help',
      label: 'Help & Documentation',
      description: 'View help center and documentation',
      icon: <HelpCircle className="w-4 h-4" />,
      category: 'Help',
      action: () => {
        window.open('/help-center', '_blank')
        onClose()
      },
    },
  ]

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = []
    }
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, Command[]>)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
          onClose()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[20vh]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[70vh] overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedIndex(0)
              }}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent border-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
            />
            <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
              Esc
            </kbd>
          </div>

          {/* Commands List */}
          <div className="overflow-y-auto max-h-[60vh]">
            {Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {category}
                </div>
                {cmds.map((cmd, idx) => {
                  const globalIndex = filteredCommands.indexOf(cmd)
                  const isSelected = globalIndex === selectedIndex
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action()
                        onClose()
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        isSelected ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      <div className="text-gray-600 dark:text-gray-400">
                        {cmd.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {cmd.label}
                        </div>
                        {cmd.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
            {filteredCommands.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                No commands found
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
