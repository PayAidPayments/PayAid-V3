'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  UserPlus, 
  Mail, 
  FileText,
  Copy,
  CheckCircle,
  User,
  Tag,
  Calendar,
  Briefcase
} from 'lucide-react'

interface RowActionsMenuProps {
  entityType: 'prospect' | 'contact' | 'customer' | 'deal'
  entityId: string
  tenantId: string
  onEdit?: () => void
  onDelete?: () => void
  onConvert?: () => void
  onAssign?: () => void
  onView?: () => void
  onDuplicate?: () => void
  onCreateDeal?: () => void
  onCreateTask?: () => void
  onCreateNote?: () => void
  onSendEmail?: () => void
  onAddTag?: () => void
}

export const RowActionsMenu: React.FC<RowActionsMenuProps> = ({
  entityType,
  entityId,
  tenantId,
  onEdit,
  onDelete,
  onConvert,
  onAssign,
  onView,
  onDuplicate,
  onCreateDeal,
  onCreateTask,
  onCreateNote,
  onSendEmail,
  onAddTag,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getEditPath = () => {
    if (entityType === 'prospect' || entityType === 'contact' || entityType === 'customer') {
      return `/crm/${tenantId}/Contacts/${entityId}/Edit`
    }
    if (entityType === 'deal') {
      return `/crm/${tenantId}/Deals/${entityId}/Edit`
    }
    return '#'
  }

  const getViewPath = () => {
    if (entityType === 'prospect' || entityType === 'contact' || entityType === 'customer') {
      return `/crm/${tenantId}/Contacts/${entityId}`
    }
    if (entityType === 'deal') {
      return `/crm/${tenantId}/Deals/${entityId}`
    }
    return '#'
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        title="More actions"
      >
        <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-50">
          <div className="py-1">
            {/* View */}
            {onView ? (
              <button
                onClick={() => {
                  onView()
                  setIsOpen(false)
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <Eye className="w-4 h-4 mr-3" />
                View Details
              </button>
            ) : (
              <Link
                href={getViewPath()}
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <Eye className="w-4 h-4 mr-3" />
                View Details
              </Link>
            )}

            {/* Edit */}
            {onEdit ? (
              <button
                onClick={() => {
                  onEdit()
                  setIsOpen(false)
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <Edit className="w-4 h-4 mr-3" />
                Edit
              </button>
            ) : (
              <Link
                href={getEditPath()}
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <Edit className="w-4 h-4 mr-3" />
                Edit
              </Link>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

            {/* Entity-specific actions */}
            {entityType === 'prospect' && onConvert && (
              <button
                onClick={() => {
                  onConvert()
                  setIsOpen(false)
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <CheckCircle className="w-4 h-4 mr-3" />
                Convert to Contact
              </button>
            )}

            {(entityType === 'prospect' || entityType === 'contact' || entityType === 'customer') && onCreateDeal && (
              <button
                onClick={() => {
                  onCreateDeal()
                  setIsOpen(false)
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <Briefcase className="w-4 h-4 mr-3" />
                Create Deal
              </button>
            )}

            {onAssign && (
              <button
                onClick={() => {
                  onAssign()
                  setIsOpen(false)
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <User className="w-4 h-4 mr-3" />
                Assign Owner
              </button>
            )}

            {onSendEmail && (
              <button
                onClick={() => {
                  onSendEmail()
                  setIsOpen(false)
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <Mail className="w-4 h-4 mr-3" />
                Send Email
              </button>
            )}

            {onCreateTask && (
              <button
                onClick={() => {
                  onCreateTask()
                  setIsOpen(false)
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <Calendar className="w-4 h-4 mr-3" />
                Create Task
              </button>
            )}

            {onCreateNote && (
              <button
                onClick={() => {
                  onCreateNote()
                  setIsOpen(false)
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <FileText className="w-4 h-4 mr-3" />
                Add Note
              </button>
            )}

            {onAddTag && (
              <button
                onClick={() => {
                  onAddTag()
                  setIsOpen(false)
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <Tag className="w-4 h-4 mr-3" />
                Add Tag
              </button>
            )}

            {onDuplicate && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button
                  onClick={() => {
                    onDuplicate()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <Copy className="w-4 h-4 mr-3" />
                  Duplicate
                </button>
              </>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

            {/* Delete */}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this record?')) {
                    onDelete()
                  }
                  setIsOpen(false)
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
