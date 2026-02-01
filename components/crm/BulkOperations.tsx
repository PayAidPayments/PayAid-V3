'use client'

import { useState } from 'react'
import { CheckSquare, Square, Trash2, Edit, Mail, Download, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface BulkOperationsProps {
  selectedItems: string[]
  itemType: 'contact' | 'deal' | 'task' | 'lead'
  onBulkUpdate?: (ids: string[], updates: Record<string, any>) => Promise<void>
  onBulkDelete?: (ids: string[]) => Promise<void>
  onBulkExport?: (ids: string[]) => Promise<void>
  onBulkEmail?: (ids: string[]) => Promise<void>
  onClearSelection: () => void
}

export function BulkOperations({
  selectedItems,
  itemType,
  onBulkUpdate,
  onBulkDelete,
  onBulkExport,
  onBulkEmail,
  onClearSelection,
}: BulkOperationsProps) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [updates, setUpdates] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  if (selectedItems.length === 0) return null

  const handleBulkUpdate = async () => {
    if (!onBulkUpdate || Object.keys(updates).length === 0) return
    setLoading(true)
    try {
      await onBulkUpdate(selectedItems, updates)
      setShowUpdateDialog(false)
      setUpdates({})
      onClearSelection()
    } catch (error) {
      console.error('Bulk update error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return
    setLoading(true)
    try {
      await onBulkDelete(selectedItems)
      setShowDeleteDialog(false)
      onClearSelection()
    } catch (error) {
      console.error('Bulk delete error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkExport = async () => {
    if (!onBulkExport) return
    setLoading(true)
    try {
      await onBulkExport(selectedItems)
      onClearSelection()
    } catch (error) {
      console.error('Bulk export error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkEmail = async () => {
    if (!onBulkEmail) return
    setLoading(true)
    try {
      await onBulkEmail(selectedItems)
      onClearSelection()
    } catch (error) {
      console.error('Bulk email error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              {selectedItems.length} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {onBulkUpdate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpdateDialog(true)}
                disabled={loading}
              >
                <Edit className="w-4 h-4 mr-2" />
                Update
              </Button>
            )}
            {onBulkEmail && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkEmail}
                disabled={loading}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            )}
            {onBulkExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkExport}
                disabled={loading}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            {onBulkDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update {itemType}s</DialogTitle>
            <DialogDescription>
              Update {selectedItems.length} selected {itemType}s
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {itemType === 'deal' && (
              <>
                <div>
                  <label className="text-sm font-medium">Stage</label>
                  <select
                    value={updates.stage || ''}
                    onChange={(e) => setUpdates({ ...updates, stage: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="">No change</option>
                    <option value="lead">Lead</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={updates.probability || ''}
                    onChange={(e) => setUpdates({ ...updates, probability: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    placeholder="No change"
                  />
                </div>
              </>
            )}
            {itemType === 'contact' && (
              <>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={updates.status || ''}
                    onChange={(e) => setUpdates({ ...updates, status: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="">No change</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="prospect">Prospect</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={updates.type || ''}
                    onChange={(e) => setUpdates({ ...updates, type: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="">No change</option>
                    <option value="customer">Customer</option>
                    <option value="lead">Lead</option>
                    <option value="partner">Partner</option>
                    <option value="vendor">Vendor</option>
                  </select>
                </div>
              </>
            )}
            {itemType === 'task' && (
              <>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={updates.status || ''}
                    onChange={(e) => setUpdates({ ...updates, status: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="">No change</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    value={updates.priority || ''}
                    onChange={(e) => setUpdates({ ...updates, priority: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="">No change</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdate} disabled={loading || Object.keys(updates).length === 0}>
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {itemType}s</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedItems.length} {itemType}(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
