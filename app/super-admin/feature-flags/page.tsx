'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoreVertical, Edit, Archive, Plus, Search, Filter, Download, RefreshCw, CheckSquare, Square, History } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { EditFeatureFlagModal } from '@/components/super-admin/feature-flags/EditFeatureFlagModal'
import { FlagHistory } from '@/components/super-admin/feature-flags/FlagHistory'

type FlagRow = {
  id: string
  featureName: string
  isEnabled: boolean
  tenantId: string | null
  settings?: {
    rolloutPercentage?: number
    targetingPlans?: string[]
    targetingTenants?: string[]
  } | null
}

export default function SuperAdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FlagRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [targetingFilter, setTargetingFilter] = useState<'all' | 'platform' | 'tenant'>('all')
  const [selectedFlags, setSelectedFlags] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [showHistory, setShowHistory] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchFlags = () => {
    setLoading(true)
    fetch('/api/super-admin/feature-flags')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => setFlags(j.data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchFlags()
  }, [])

  const [editingFlag, setEditingFlag] = useState<FlagRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleEdit = (flag: FlagRow) => {
    setEditingFlag(flag)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingFlag(null)
  }

  const handleArchive = async (flag: FlagRow) => {
    if (!confirm(`Are you sure you want to archive "${flag.featureName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/super-admin/feature-flags/${flag.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to archive feature flag')
      }

      toast({
        title: 'Success',
        description: `Feature flag "${flag.featureName}" archived successfully`,
      })

      fetchFlags()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to archive feature flag',
        variant: 'destructive',
      })
    }
  }

  const handleToggleStatus = async (flag: FlagRow) => {
    try {
      const response = await fetch(`/api/super-admin/feature-flags/${flag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureName: flag.featureName,
          isEnabled: !flag.isEnabled,
          settings: flag.settings || {},
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle feature flag')
      }

      toast({
        title: 'Success',
        description: `Feature flag "${flag.featureName}" ${!flag.isEnabled ? 'enabled' : 'disabled'}`,
      })

      fetchFlags()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to toggle feature flag',
        variant: 'destructive',
      })
    }
  }

  const handleCreateNew = () => {
    setEditingFlag(null)
    setIsModalOpen(true)
  }

  const handleBulkAction = async (action: 'enable' | 'disable' | 'archive') => {
    if (selectedFlags.size === 0) {
      toast({
        title: 'No selection',
        description: 'Please select at least one flag',
        variant: 'destructive',
      })
      return
    }

    if (action === 'archive' && !confirm(`Archive ${selectedFlags.size} feature flag(s)?`)) {
      return
    }

    setBulkLoading(true)
    try {
      const promises = Array.from(selectedFlags).map((flagId) => {
        const flag = flags.find((f) => f.id === flagId)
        if (!flag) return Promise.resolve()

        if (action === 'archive') {
          return fetch(`/api/super-admin/feature-flags/${flagId}`, { method: 'DELETE' })
        } else {
          return fetch(`/api/super-admin/feature-flags/${flagId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              featureName: flag.featureName,
              isEnabled: action === 'enable',
              settings: flag.settings || {},
            }),
          })
        }
      })

      await Promise.all(promises)
      toast({
        title: 'Success',
        description: `${selectedFlags.size} flag(s) ${action === 'enable' ? 'enabled' : action === 'disable' ? 'disabled' : 'archived'}`,
      })
      setSelectedFlags(new Set())
      fetchFlags()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Bulk action failed',
        variant: 'destructive',
      })
    } finally {
      setBulkLoading(false)
    }
  }

  const toggleSelect = (flagId: string) => {
    const newSelected = new Set(selectedFlags)
    if (newSelected.has(flagId)) {
      newSelected.delete(flagId)
    } else {
      newSelected.add(flagId)
    }
    setSelectedFlags(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedFlags.size === filteredFlags.length) {
      setSelectedFlags(new Set())
    } else {
      setSelectedFlags(new Set(filteredFlags.map((f) => f.id)))
    }
  }

  const handleExport = () => {
    const csv = [
      ['Flag Key', 'Description', 'Status', 'Targeting', 'Created At'].join(','),
      ...flags.map((f) =>
        [
          f.featureName,
          f.tenantId ? 'Tenant-specific' : 'Platform-wide',
          f.isEnabled ? 'Enabled' : 'Disabled',
          f.tenantId ? `Tenant: ${f.tenantId}` : 'All Tenants',
          new Date().toISOString(),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feature-flags-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Success',
      description: 'Feature flags exported successfully',
    })
  }

  // Filter flags based on search and filters
  const filteredFlags = flags.filter((f) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !f.featureName.toLowerCase().includes(query) &&
        !(f.tenantId ? 'Tenant-specific' : 'Platform-wide').toLowerCase().includes(query)
      ) {
        return false
      }
    }

    // Status filter
    if (statusFilter === 'enabled' && !f.isEnabled) return false
    if (statusFilter === 'disabled' && f.isEnabled) return false

    // Targeting filter
    if (targetingFilter === 'platform' && f.tenantId) return false
    if (targetingFilter === 'tenant' && !f.tenantId) return false

    return true
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feature Flags</h1>
          <p className="text-muted-foreground">Platform and tenant-level toggles</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedFlags.size > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => handleBulkAction('enable')}
                size="sm"
                disabled={bulkLoading}
              >
                Enable ({selectedFlags.size})
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkAction('disable')}
                size="sm"
                disabled={bulkLoading}
              >
                Disable ({selectedFlags.size})
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkAction('archive')}
                size="sm"
                disabled={bulkLoading}
              >
                Archive ({selectedFlags.size})
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleExport} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchFlags} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Flag
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search flags by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
          <select
            value={targetingFilter}
            onChange={(e) => setTargetingFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Targeting</option>
            <option value="platform">Platform-wide</option>
            <option value="tenant">Tenant-specific</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredFlags.length} of {flags.length} feature flags
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : filteredFlags.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          {flags.length === 0 ? (
            <>
              <p className="mb-4">No feature flags found.</p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Flag
              </Button>
            </>
          ) : (
            'No flags match your search criteria. Try adjusting your filters.'
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <button onClick={toggleSelectAll} className="p-1">
                    {selectedFlags.size === filteredFlags.length && filteredFlags.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </TableHead>
                <TableHead>Flag Key</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Targeting</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFlags.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <button onClick={() => toggleSelect(f.id)} className="p-1">
                      {selectedFlags.has(f.id) ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{f.featureName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {f.tenantId ? `Tenant-specific` : 'Platform-wide'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={f.isEnabled ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => handleToggleStatus(f)}
                      className="cursor-pointer"
                    >
                      {f.isEnabled ? 'On' : 'Off'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {f.tenantId ? (
                      <Badge variant="outline">Tenant: {f.tenantId.slice(0, 8)}...</Badge>
                    ) : f.settings?.targetingPlans?.length || f.settings?.targetingTenants?.length ? (
                      <div className="flex flex-col gap-1">
                        {(f.settings.targetingPlans?.length ?? 0) > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Plans: {f.settings.targetingPlans?.join(', ') ?? ''}
                          </Badge>
                        )}
                        {(f.settings.targetingTenants?.length ?? 0) > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {f.settings.targetingTenants?.length ?? 0} tenant(s)
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline">All Tenants</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHistory(showHistory === f.id ? null : f.id)}
                        className="h-8"
                        title="View change history"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(f)}
                        className="h-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <div className="relative group">
                        <Button size="sm" variant="ghost" title="More actions" className="h-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <div className="py-1">
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => handleArchive(f)}
                            >
                              <Archive className="h-4 w-4" />
                              Archive
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {showHistory && (
        <div className="border-t p-4 bg-muted/30 rounded-md border">
          <FlagHistory flagId={showHistory} onClose={() => setShowHistory(null)} />
        </div>
      )}
      <EditFeatureFlagModal
        flag={editingFlag}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={fetchFlags}
      />
    </div>
  )
}
