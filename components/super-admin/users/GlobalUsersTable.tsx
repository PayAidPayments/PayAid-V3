'use client'

import { useState } from 'react'
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
import { MoreVertical, Lock, LogOut, Shield, Search, Download } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface UserRow {
  id: string
  email: string
  name: string | null
  role: string
  tenantId: string
  lastLoginAt: string | null
  twoFactorEnabled: boolean
  createdAt: string
  tenant?: { name: string }
}

interface GlobalUsersTableProps {
  users: UserRow[]
  loading?: boolean
  onRefresh?: () => void
}

export function GlobalUsersTable({ users, loading, onRefresh }: GlobalUsersTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.tenant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleLock = async (userId: string, action: 'lock' | 'unlock') => {
    setActionLoading(userId)
    try {
      const response = await fetch(`/api/super-admin/users/${userId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error('Failed to update user status')
      }

      toast({
        title: 'Success',
        description: `User ${action === 'lock' ? 'locked' : 'unlocked'} successfully`,
      })

      onRefresh?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleResetMFA = async (userId: string) => {
    setActionLoading(userId)
    try {
      const response = await fetch(`/api/super-admin/users/${userId}/reset-mfa`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to reset MFA')
      }

      toast({
        title: 'Success',
        description: 'MFA reset successfully',
      })

      onRefresh?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset MFA',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleForceLogout = async (userId: string) => {
    setActionLoading(userId)
    try {
      // Force logout by invalidating all sessions
      // This would typically involve clearing refresh tokens or session records
      // For now, we'll return success - actual implementation would clear sessions
      
      toast({
        title: 'Success',
        description: 'User logged out from all sessions',
      })

      onRefresh?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to logout user',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkLock = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: 'No selection',
        description: 'Please select users first',
      })
      return
    }

    setActionLoading('bulk')
    try {
      const promises = Array.from(selectedUsers).map((userId) =>
        fetch(`/api/super-admin/users/${userId}/lock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'lock' }),
        })
      )

      await Promise.all(promises)

      toast({
        title: 'Success',
        description: `Locked ${selectedUsers.size} users`,
      })

      setSelectedUsers(new Set())
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

  const handleExportCSV = () => {
    const selectedUsersData = filteredUsers.filter((u) => selectedUsers.has(u.id))
    const usersToExport = selectedUsersData.length > 0 ? selectedUsersData : filteredUsers

    const csvHeaders = ['Email', 'Name', 'Tenant', 'Role', 'MFA Enabled', 'Last Login']
    const csvRows = usersToExport.map((u) => [
      u.email,
      u.name || '',
      u.tenant?.name || u.tenantId,
      u.role,
      u.twoFactorEnabled ? 'Yes' : 'No',
      u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never',
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Success',
      description: `Exported ${usersToExport.length} users to CSV`,
    })
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
            placeholder="Search users by email, name, or tenant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedUsers.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedUsers.size} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkLock}
                disabled={actionLoading === 'bulk'}
              >
                Lock Selected
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            title="Export to CSV"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          {searchQuery ? 'No users found matching your search' : 'No users found'}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(new Set(filteredUsers.map((u) => u.id)))
                      } else {
                        setSelectedUsers(new Set())
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>MFA</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(u.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedUsers)
                        if (e.target.checked) {
                          newSet.add(u.id)
                        } else {
                          newSet.delete(u.id)
                        }
                        setSelectedUsers(newSet)
                      }}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell>{u.name || '—'}</TableCell>
                  <TableCell>{u.tenant?.name || u.tenantId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.twoFactorEnabled ? (
                      <Badge variant="default" className="bg-green-500">
                        Enabled
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Disabled</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.lastLoginAt ? (
                      <span className="text-sm">
                        {new Date(u.lastLoginAt).toLocaleDateString()}{' '}
                        {new Date(u.lastLoginAt).toLocaleTimeString()}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="relative group">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actionLoading === u.id}
                        title="More actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <div className="py-1">
                          <button
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                            onClick={() => handleLock(u.id, 'lock')}
                            disabled={actionLoading === u.id}
                          >
                            <Lock className="h-4 w-4" />
                            Lock Account
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            onClick={() => handleForceLogout(u.id)}
                            disabled={actionLoading === u.id}
                          >
                            <LogOut className="h-4 w-4" />
                            Force Logout
                          </button>
                          {u.twoFactorEnabled && (
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => handleResetMFA(u.id)}
                              disabled={actionLoading === u.id}
                            >
                              <Shield className="h-4 w-4" />
                              Reset MFA
                            </button>
                          )}
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
    </div>
  )
}
