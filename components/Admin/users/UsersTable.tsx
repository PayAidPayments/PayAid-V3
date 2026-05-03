'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MoreVertical, Search, Plus, Edit, Trash2, Shield, Puzzle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  lastLoginAt?: string | null
  createdAt: string
}

interface UsersTableProps {
  users: User[]
  loading: boolean
  onRefresh: () => void
  onOpenModuleAccess?: (userId: string, userName: string) => void
  onOpenRoleAssignment?: (userId: string, userName: string) => void
}

export function UsersTable({ users, loading, onRefresh, onOpenModuleAccess, onOpenRoleAssignment }: UsersTableProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
      case 'admin':
        return 'default'
      case 'manager':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users by email, name, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedUsers.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: 'Bulk action',
                  description: `${selectedUsers.size} users selected`,
                })
              }}
            >
              Bulk Actions ({selectedUsers.size})
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
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
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedUsers)
                          if (e.target.checked) {
                            newSet.add(user.id)
                          } else {
                            newSet.delete(user.id)
                          }
                          setSelectedUsers(newSet)
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setOpenDropdown(openDropdown === user.id ? null : user.id)
                          }
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        {openDropdown === user.id && (
                          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  // TODO: Open edit user modal
                                  setOpenDropdown(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Edit User
                              </button>
                              <button
                                onClick={() => {
                                  if (onOpenRoleAssignment) {
                                    onOpenRoleAssignment(user.id, user.name || user.email)
                                  }
                                  setOpenDropdown(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Shield className="h-4 w-4" />
                                Manage Roles
                              </button>
                              <button
                                onClick={() => {
                                  if (onOpenModuleAccess) {
                                    onOpenModuleAccess(user.id, user.name || user.email)
                                  }
                                  setOpenDropdown(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Puzzle className="h-4 w-4" />
                                Module Access
                              </button>
                              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                              <button
                                onClick={async () => {
                                  if (
                                    confirm(
                                      `Are you sure you want to remove ${user.email}? This action cannot be undone.`
                                    )
                                  ) {
                                    try {
                                      const response = await fetch(`/api/admin/users/${user.id}`, {
                                        method: 'DELETE',
                                      })
                                      if (response.ok) {
                                        toast({
                                          title: 'Success',
                                          description: 'User removed successfully',
                                        })
                                        onRefresh()
                                      } else {
                                        throw new Error('Failed to remove user')
                                      }
                                    } catch (error) {
                                      toast({
                                        title: 'Error',
                                        description: 'Failed to remove user',
                                        variant: 'destructive',
                                      })
                                    }
                                  }
                                  setOpenDropdown(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove User
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
