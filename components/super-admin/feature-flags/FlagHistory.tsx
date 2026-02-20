'use client'

import { useEffect, useState } from 'react'
import { Clock, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface HistoryEntry {
  id: string
  changedBy: string
  changeSummary: string
  beforeSnapshot: any
  afterSnapshot: any
  timestamp: string
  ipAddress?: string
}

interface FlagHistoryProps {
  flagId: string
  onClose: () => void
}

export function FlagHistory({ flagId, onClose }: FlagHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [flagId])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/super-admin/feature-flags/${flagId}/history`)
      if (res.ok) {
        const json = await res.json()
        setHistory(json.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Change History</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Change History</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">No change history available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Change History</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {history.map((entry) => (
          <div key={entry.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{entry.changeSummary}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{entry.changedBy}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {entry.beforeSnapshot && entry.afterSnapshot && (
              <div className="mt-2 pt-2 border-t text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="font-medium text-red-600">Before:</p>
                    <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(entry.beforeSnapshot, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="font-medium text-green-600">After:</p>
                    <pre className="text-xs bg-green-50 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(entry.afterSnapshot, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
