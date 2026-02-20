'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { MoreVertical, Eye, UserCog, Ban, ArrowUpDown, Search, Download } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface TenantRow {
  id: string
  name: string
  subdomain: string | null
  status: string
  subscriptionTier: string
  plan?: string
  licensedModules: string[]
  maxUsers: number
  createdAt: string
  lastLoginAt?: string | null
  usage?: {
    users: number
    contacts: number
    invoices: number
    overall: number
  }
  activeUsers?: number
  paymentsMTD?: number
  transactionsMTD?: number
  _count?: { users: number }
}

interface TenantsTableProps {
  tenants: TenantRow[]
  loading?: boolean
  onRefresh?: () => void
}

export function TenantsTable({ tenants, loading, onRefresh }: TenantsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTenants, setSelectedTenants] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const { toast } = useToast()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const ref = dropdownRefs.current[openDropdown]
        const trigger = triggerRefs.current[openDropdown]
        const target = event.target as Node
        if (ref && !ref.contains(target) && trigger && !trigger.contains(target)) {
          setOpenDropdown(null)
          setDropdownPosition(null)
        }
      }
    }

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  const openDropdownMenu = (tenantId: string) => {
    if (openDropdown === tenantId) {
      setOpenDropdown(null)
      setDropdownPosition(null)
      return
    }
    const trigger = triggerRefs.current[tenantId]
    if (trigger) {
      const rect = trigger.getBoundingClientRect()
      const dropdownHeight = 180
      const spaceBelow = window.innerHeight - rect.bottom
      const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight
      setDropdownPosition({
        left: Math.max(8, rect.right - 192),
        top: openAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      })
    } else {
      setDropdownPosition({ left: 0, top: 0 })
    }
    setOpenDropdown(tenantId)
  }

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subscriptionTier.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSuspend = async (tenantId: string, action: 'suspend' | 'activate') => {
    setActionLoading(tenantId)
    try {
      const response = await fetch(`/api/super-admin/tenants/${tenantId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error('Failed to update tenant status')
      }

      toast({
        title: 'Success',
        description: `Tenant ${action === 'suspend' ? 'suspended' : 'activated'} successfully`,
      })

      onRefresh?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update tenant',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleImpersonate = async (tenantId: string) => {
    setActionLoading(tenantId)
    try {
      const response = await fetch(`/api/super-admin/tenants/${tenantId}/impersonate`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to impersonate tenant')
      }

      const data = await response.json()

      // Store impersonation token and redirect
      if (data.token) {
        document.cookie = `token=${data.token}; path=/; max-age=86400`
        window.location.href = `/crm/${tenantId}/Home`
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to impersonate tenant',
        variant: 'destructive',
      })
      setActionLoading(null)
    }
  }

  const handleChangePlan = async (tenantId: string, plan: string) => {
    setActionLoading(tenantId)
    try {
      const response = await fetch(`/api/super-admin/tenants/${tenantId}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      if (!response.ok) {
        throw new Error('Failed to update plan')
      }

      toast({
        title: 'Success',
        description: `Plan updated to ${plan}`,
      })

      onRefresh?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update plan',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleExportCSV = () => {
    const headers = ['Name', 'Plan', 'Status', 'Active Users', 'Payments (MTD)', 'Transactions', 'Last Login', 'Created']
    const rows = filteredTenants.map((t) => [
      t.name,
      t.subscriptionTier || t.plan || 'free',
      t.status,
      t.activeUsers ?? t._count?.users ?? 0,
      t.paymentsMTD ? `₹${(t.paymentsMTD / 1000).toFixed(0)}K` : '₹0',
      t.transactionsMTD ?? 0,
      t.lastLoginAt ? new Date(t.lastLoginAt).toLocaleDateString() : 'Never',
      new Date(t.createdAt).toLocaleDateString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `merchants-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: 'Success',
      description: 'CSV exported successfully',
    })
  }

  const handleBulkAction = async (action: 'suspend' | 'upgrade') => {
    if (selectedTenants.size === 0) {
      toast({
        title: 'No selection',
        description: 'Please select tenants first',
      })
      return
    }

    setActionLoading('bulk')
    try {
      const promises = Array.from(selectedTenants).map((tenantId) => {
        if (action === 'suspend') {
          return fetch(`/api/super-admin/tenants/${tenantId}/suspend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'suspend' }),
          })
        } else {
          return fetch(`/api/super-admin/tenants/${tenantId}/plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: 'growth' }),
          })
        }
      })

      await Promise.all(promises)

      toast({
        title: 'Success',
        description: `Bulk action completed for ${selectedTenants.size} tenants`,
      })

      setSelectedTenants(new Set())
      onRefresh?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Bulk Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {selectedTenants.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedTenants.size} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('suspend')}
                disabled={actionLoading === 'bulk'}
              >
                Suspend Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('upgrade')}
                disabled={actionLoading === 'bulk'}
              >
                Upgrade to Growth
              </Button>
            </>
          )}
        </div>
      </div>

      {filteredTenants.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          {searchQuery ? 'No tenants found matching your search' : 'No tenants found'}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedTenants.size === filteredTenants.length && filteredTenants.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTenants(new Set(filteredTenants.map((t) => t.id)))
                      } else {
                        setSelectedTenants(new Set())
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payments (MTD)</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Active Users</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedTenants.has(t.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedTenants)
                        if (e.target.checked) {
                          newSet.add(t.id)
                        } else {
                          newSet.delete(t.id)
                        }
                        setSelectedTenants(newSet)
                      }}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.subscriptionTier || t.plan || 'free'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'active' ? 'default' : 'secondary'}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {t.paymentsMTD ? `₹${(t.paymentsMTD / 1000).toFixed(0)}K` : '₹0'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{t.transactionsMTD ?? 0}</span>
                  </TableCell>
                  <TableCell>
                    {t.activeUsers ?? t._count?.users ?? 0} / {t.maxUsers}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {t.lastLoginAt
                        ? new Date(t.lastLoginAt).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/super-admin/tenants/${t.id}`}>
                        <Button size="sm" variant="ghost" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <div className="relative" ref={(el) => { dropdownRefs.current[t.id] = el }}>
                        <Button
                          ref={(el) => { triggerRefs.current[t.id] = el }}
                          size="sm"
                          variant="ghost"
                          disabled={actionLoading === t.id}
                          title="More actions"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDropdownMenu(t.id)
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        {openDropdown === t.id &&
                          dropdownPosition &&
                          typeof document !== 'undefined' &&
                          createPortal(
                            <div
                              ref={(el) => { dropdownRefs.current[t.id] = el }}
                              className="fixed w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-[100] py-1"
                              style={{
                                top: dropdownPosition.top,
                                left: dropdownPosition.left,
                              }}
                            >
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenDropdown(null)
                                  setDropdownPosition(null)
                                  handleImpersonate(t.id)
                                }}
                                disabled={actionLoading === t.id}
                              >
                                <UserCog className="h-4 w-4" />
                                Impersonate
                              </button>
                              {t.status === 'active' ? (
                                <button
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenDropdown(null)
                                    setDropdownPosition(null)
                                    handleSuspend(t.id, 'suspend')
                                  }}
                                  disabled={actionLoading === t.id}
                                >
                                  <Ban className="h-4 w-4" />
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  className="w-full text-left px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenDropdown(null)
                                    setDropdownPosition(null)
                                    handleSuspend(t.id, 'activate')
                                  }}
                                  disabled={actionLoading === t.id}
                                >
                                  <Ban className="h-4 w-4" />
                                  Activate
                                </button>
                              )}
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenDropdown(null)
                                  setDropdownPosition(null)
                                  const newPlan =
                                    t.subscriptionTier === 'free' ? 'growth' : 'enterprise'
                                  handleChangePlan(t.id, newPlan)
                                }}
                                disabled={actionLoading === t.id}
                              >
                                <ArrowUpDown className="h-4 w-4" />
                                Change Plan
                              </button>
                            </div>,
                            document.body
                          )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
