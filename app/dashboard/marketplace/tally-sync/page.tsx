'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CheckCircle, XCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react'

interface SyncStatus {
  lastSyncAt: string | null
  status: 'idle' | 'syncing' | 'success' | 'error'
  direction: 'payaid_to_tally' | 'tally_to_payaid' | 'both'
  conflicts: number
  synced: {
    contacts: number
    invoices: number
  }
}

export default function TallySyncPage() {
  const [syncDirection, setSyncDirection] = useState<'payaid_to_tally' | 'tally_to_payaid' | 'both'>('both')

  const { data: status, refetch } = useQuery<SyncStatus>({
    queryKey: ['tally-sync-status'],
    queryFn: async () => {
      const res = await fetch('/api/integrations/tally/sync', {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Failed to load sync status')
      return res.json()
    },
  })

  const syncMutation = useMutation({
    mutationFn: async (direction: string) => {
      const res = await fetch('/api/integrations/tally/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ direction }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Sync failed')
      }
      return res.json()
    },
    onSuccess: () => {
      setTimeout(() => refetch(), 2000)
    },
  })

  const handleSync = () => {
    syncMutation.mutate(syncDirection)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <RefreshCw className="h-7 w-7 text-purple-600" />
          Tally Sync
        </h1>
        <p className="text-gray-600 mt-1">
          Two-way synchronization between PayAid and Tally accounting software
        </p>
      </div>

      {/* Sync Status */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Status</CardTitle>
            <CardDescription>Last synchronization details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Last Sync</div>
                <div className="font-semibold">
                  {status.lastSyncAt
                    ? new Date(status.lastSyncAt).toLocaleString()
                    : 'Never'}
                </div>
              </div>
              <Badge
                variant={
                  status.status === 'success'
                    ? 'default'
                    : status.status === 'error'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {status.status === 'success' && <CheckCircle className="h-4 w-4 mr-1" />}
                {status.status === 'error' && <XCircle className="h-4 w-4 mr-1" />}
                {status.status === 'syncing' && <RefreshCw className="h-4 w-4 mr-1 animate-spin" />}
                {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
              </Badge>
            </div>

            {status.synced && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-gray-600">Contacts Synced</div>
                  <div className="text-2xl font-bold">{status.synced.contacts || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Invoices Synced</div>
                  <div className="text-2xl font-bold">{status.synced.invoices || 0}</div>
                </div>
              </div>
            )}

            {status.conflicts > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-semibold text-yellow-900">{status.conflicts} conflicts detected</div>
                  <div className="text-sm text-yellow-700">Review and resolve conflicts</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sync Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Configuration</CardTitle>
          <CardDescription>Choose synchronization direction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="direction"
                value="payaid_to_tally"
                checked={syncDirection === 'payaid_to_tally'}
                onChange={(e) => setSyncDirection(e.target.value as any)}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-semibold flex items-center gap-2">
                  PayAid → Tally
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="text-sm text-gray-600">Sync contacts and invoices from PayAid to Tally</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="direction"
                value="tally_to_payaid"
                checked={syncDirection === 'tally_to_payaid'}
                onChange={(e) => setSyncDirection(e.target.value as any)}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-semibold flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Tally → PayAid
                </div>
                <div className="text-sm text-gray-600">Sync contacts and invoices from Tally to PayAid</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="direction"
                value="both"
                checked={syncDirection === 'both'}
                onChange={(e) => setSyncDirection(e.target.value as any)}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-semibold flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Both Ways
                  <ArrowLeft className="h-4 w-4" />
                </div>
                <div className="text-sm text-gray-600">Two-way synchronization (recommended)</div>
              </div>
            </label>
          </div>

          <Button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="w-full"
            size="lg"
          >
            {syncMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Start Sync
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Recent synchronization activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Sync history will appear here after first sync
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
