'use client'

import { 
  Edit, 
  Trash2, 
  UserPlus, 
  Mail, 
  Download,
  Tag,
  CheckCircle,
  Copy,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BulkActionsBarProps {
  selectedCount: number
  entityType: 'prospect' | 'contact' | 'customer' | 'deal'
  onEdit?: () => void
  onDelete?: () => void
  onAssign?: () => void
  onExport?: () => void
  onConvert?: () => void
  onTag?: () => void
  onEmail?: () => void
  onDuplicate?: () => void
  onClearSelection: () => void
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  entityType,
  onEdit,
  onDelete,
  onAssign,
  onExport,
  onConvert,
  onTag,
  onEmail,
  onDuplicate,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 mr-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {selectedCount} {selectedCount === 1 ? 'record' : 'records'} selected
          </span>
          <button
            onClick={onClearSelection}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        )}

        {onAssign && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAssign}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Assign
          </Button>
        )}

        {entityType === 'prospect' && onConvert && (
          <Button
            variant="outline"
            size="sm"
            onClick={onConvert}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Convert
          </Button>
        )}

        {onTag && (
          <Button
            variant="outline"
            size="sm"
            onClick={onTag}
            className="flex items-center gap-2"
          >
            <Tag className="w-4 h-4" />
            Tag
          </Button>
        )}

        {onEmail && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEmail}
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Email
          </Button>
        )}

        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        )}

        {onDuplicate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDuplicate}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </Button>
        )}

        {onDelete && (
          <>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${selectedCount} record(s)?`)) {
                  onDelete()
                }
              }}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
